import pandas as pd
import numpy as np

MAX_CATEGORIES_BAR = 20
MAX_CATEGORIES_PIE = 6
MAX_BINS = 10
MAX_OTHER_SHARE = 0.5

def clean_bar_data(data:pd.Series, col_name:str, max_categories:int=MAX_CATEGORIES_BAR) -> list[dict]:
    count = data.dropna().value_counts()
    if len(count) > max_categories:
        if pd.api.types.is_numeric_dtype(data):
            return clean_histogram_data(data, col_name)
        top_counts = count.head(max_categories - 1)
        other_counts = count.iloc[max_categories-1:].sum()
        if other_counts / int(count.sum()) > MAX_OTHER_SHARE:
            return [
                {
                    "category": str(cat),
                    "count": int(frequency),
                    "col": f"{col_name} (top {max_categories} of {len(count)} values)",
                }
                for cat, frequency in count.head(max_categories).items()
            ]
        res = [{col_name: str(cat), 'counts': int(frequency)} for cat, frequency in top_counts.items()]
        res.append({'others': int(other_counts)})
        frequencies = [res]
    else:
        count = data.dropna().value_counts()
        outlier_extra = 0
        if pd.api.types.is_numeric_dtype(data):
            inliers, outliers = _split_outliers(data.dropna())
            if len(outliers) > 0:
                outlier_extra = len(outliers)
                count = inliers.value_counts()
        frequencies = [[{col_name:str(cat), 'counts': int(frequency)} for cat, frequency in count.items()]]
        if outlier_extra > 0:
            frequencies[0].append({'others': outlier_extra})

    return frequencies

def clean_pie_data(data:pd.Series, col_name:str, max_categories:int = MAX_CATEGORIES_PIE) -> list[dict]:
    count = data.dropna().value_counts()
    try:
        count = count.sort_index()
    except TypeError:
        pass
    if count.empty:
        return [[]]  # all-null column — frontend renders a "no chartable data" placeholder
    if len(count) > max_categories:
        top_counts = count.head(max_categories - 1)
        other_counts = count.iloc[max_categories-1:].sum()
        res = [{col_name: str(cat), 'counts': int(frequency)} for cat, frequency in top_counts.items()]
        res.append({'others': int(other_counts)})
        frequencies = [res]
    else:
        frequencies = [[{col_name:str(cat), 'counts': int(frequency)} for cat, frequency in count.items()]]
    return frequencies

MAX_OUTLIER_STD = 3

def _split_outliers(non_null: pd.Series) -> tuple[pd.Series, pd.Series]:
    """Splits values into inliers and values sitting MAX_OUTLIER_STD standard
    deviations from the median. Garbage rows (e.g. beds=1000) surface as a
    separate 'extreme-outliers' bucket instead of stretching the bin range."""
    std = non_null.std()
    if len(non_null) == 0 or pd.isna(std) or std == 0:
        return non_null, non_null.iloc[0:0]
    med = non_null.median()
    lo, hi = med - MAX_OUTLIER_STD * std, med + MAX_OUTLIER_STD * std
    mask = non_null.between(lo, hi)
    return non_null[mask], non_null[~mask]

def _is_integer_col(non_null: pd.Series) -> bool:
    try:
        return bool((non_null == non_null.round()).all())
    except TypeError:
        return False

def _format_label(low: float, high: float, is_integer: bool) -> str:
    if low == high:
        return f"{int(low)}" if is_integer else f"{low:.1f}"
    # ' to ' instead of '-' so negative ranges don't read as "-43.5--28.9"
    if is_integer:
        return f"{int(low)} to {int(high)}"
    return f"{low:.1f} to {high:.1f}"

def clean_histogram_data(data:pd.Series, col_name:str, max_bins:int = MAX_BINS, strategy:str = 'Quantile'):
    n_unique = data.nunique()
    if n_unique <= max_bins:
        # few distinct values -> show them as plain counts instead of binning
        return clean_bar_data(data, col_name)

    # Garbage/absurd values must not stretch the bin range — bin the inliers,
    # report the outliers as their own transparent bucket.
    inliers, outliers = _split_outliers(data.dropna())
    if inliers.empty:
        inliers = data.dropna()

    if strategy == 'Quantile':
        bin_edges = np.quantile(inliers, np.linspace(0, 1, max_bins + 1))
        bin_edges = np.unique(bin_edges)  # collapse duplicate edges from heavy skew
        if len(bin_edges) < 2:
            bin_edges = np.linspace(inliers.min(), inliers.max() + 1, max_bins + 1)
    else:
        bin_edges = np.linspace(inliers.min(), inliers.max(), max_bins + 1)

    counts, edges = np.histogram(inliers, bins=bin_edges)
    is_int = _is_integer_col(inliers)
    chart = [
        {
            "category": _format_label(edges[i], edges[i + 1], is_int),
            "count": int(counts[i]),
            "col": col_name
        }
        for i in range(len(counts))
        if counts[i] > 0  # drop empty bins rather than showing zero-height noise
    ]
    if len(outliers) > 0:
        chart.append({"category": "extreme-outliers", "count": int(len(outliers)), "col": col_name})
    return chart


def main(data:pd.DataFrame, results:dict, max_categories:int = 20) -> list[dict]:
    simplified_data = []
    for col, vil in results.items():
        series = data[col]
        if vil == 'bar':
            simplified_data.append({'bar': clean_bar_data(series, col, max_categories=max_categories)})
        elif vil == 'pie':
            simplified_data.append({'pie': clean_pie_data(series, col)})
        elif vil == 'histogram':
            simplified_data.append({'histogram': clean_histogram_data(series, col)})

    return simplified_data