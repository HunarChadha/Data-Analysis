import pandas as pd
import numpy as np

DATE_DETECTION_SAMPLE_SIZE = 2000

def safe_num(val) -> float:
    """Coerce NaN/inf to 0.0 so they don't leak into the feature vector."""
    try:
        if val is None or not np.isfinite(val):
            return 0.0
    except TypeError:
        return 0.0
    return float(val)


def extract_features(series: pd.Series, col_name: str = "") -> dict | None:
    """Computes a fixed-size feature vector describing a Pandas Series."""
    n = len(series)
    non_null = series.dropna()

    if n == 0 or len(non_null) == 0:
        return None

    n_unique = non_null.nunique()
    pct_unique = n_unique / len(non_null)
    pct_missing = 1.0 - (len(non_null) / n)

    is_numeric = pd.api.types.is_numeric_dtype(series)
    is_datetime = pd.api.types.is_datetime64_any_dtype(series)
    pct_numeric = 1.0 if is_numeric else 0.0

    # --- Date Parsing (Optimized) ---
    if is_datetime:
        pct_dateish = 1.0
    elif not is_numeric:
        # Sample for string-based date parsing
        str_vals = non_null.astype(str)
        date_sample = (
            str_vals.sample(DATE_DETECTION_SAMPLE_SIZE, random_state=0)
            if len(str_vals) > DATE_DETECTION_SAMPLE_SIZE
            else str_vals
        )
        try:
            parsed_dates = pd.to_datetime(date_sample, errors="coerce", format="mixed")
            pct_dateish = float(parsed_dates.notna().mean())
        except Exception:
            pct_dateish = 0.0
    else:
        pct_dateish = 0.0

    # --- String Features ---
    if not is_numeric:
        str_vals = non_null.astype(str) if 'str_vals' not in locals() else str_vals
        avg_str_len = float(str_vals.str.len().mean())
    else:
        avg_str_len = 0.0

    # --- Numeric Distribution Features ---
    if is_numeric:
        mean = float(non_null.mean())
        std = float(non_null.std()) if len(non_null) > 1 else 0.0
        skew = float(non_null.skew()) if len(non_null) > 2 else 0.0

        # Efficient integer check for numeric series
        is_integer = int(np.all(np.mod(non_null, 1) == 0))

        try:
            is_monotonic = int(
                non_null.is_monotonic_increasing or non_null.is_monotonic_decreasing
            )
        except Exception:
            is_monotonic = 0
    else:
        mean, std, skew = 0.0, 0.0, 0.0
        is_integer, is_monotonic = 0, 0

    # --- Heuristic ID Detection ---
    name_lower = col_name.lower()
    name_hints_id = any(tok in name_lower for tok in ["id", "uuid", "guid", "index", "key"])
    looks_like_date = (not is_numeric) and safe_num(pct_dateish) >= 0.5

    is_id_like = int(
        pct_unique > 0.95
        and (name_hints_id or not is_numeric)
        and not looks_like_date
    )

    return {
        "pct_unique": round(pct_unique, 4),
        "pct_missing": round(pct_missing, 4),
        "pct_numeric": pct_numeric,
        "n_unique": n_unique,
        "n_unique_capped": min(n_unique, 50),
        "avg_str_len": round(safe_num(avg_str_len), 2),
        "pct_dateish": round(safe_num(pct_dateish), 4),
        "is_boolean_like": int(n_unique == 2),
        "is_integer": is_integer,
        "is_monotonic": is_monotonic,
        "is_id_like": is_id_like,
        "row_count": n,
        "mean": round(safe_num(mean), 4) if is_numeric else 0.0,
        "std": round(safe_num(std), 4) if is_numeric else 0.0,
        "skew": round(safe_num(skew), 4) if is_numeric else 0.0,
    }