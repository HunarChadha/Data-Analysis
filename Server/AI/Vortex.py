import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import numpy as np



# set device
device = torch.accelerator.current_accelerator().type if torch.accelerator.is_available() else "cpu"
print(f"Using {device} device")

#--------------------------------------------------- decare constants
NUMERIC_COLS = [
    "pct_unique", "pct_missing", "pct_numeric", "n_unique", "n_unique_capped",
    "avg_str_len", "pct_dateish", "is_boolean_like", "is_integer",
    "is_monotonic", "is_id_like", "row_count", "mean", "std", "skew",
]
LOG_COLS = ["n_unique", "n_unique_capped", "row_count", "avg_str_len"]  # heavy-tailed

#-------------------------------------------------- prep data


def prep_data(feature_dict: dict, feature_cols: list, log_cols: list) -> np.ndarray:
    """Transforms a single feature dictionary into a normalized 1-row feature array."""
    row = np.array([[feature_dict[c] for c in feature_cols]], dtype=np.float32)
    for i, c in enumerate(feature_cols):
        if c in log_cols:
            row[0, i] = np.log1p(max(row[0, i], 0.0))
    return np.nan_to_num(row, nan=0.0, posinf=0.0, neginf=0.0)

def load_model(filename: str, model: nn.Module):
    """Loads model state dictionary and preprocessing metadata safely."""
    checkpoint = torch.load(filename, weights_only=False)

    model.load_state_dict(checkpoint["model_state"])
    print(f"Loaded model from {filename}")
    return {
            "model": model,
            "scaler_mean": checkpoint["scaler_mean"],
            "scaler_scale": checkpoint["scaler_scale"],
            "label_classes": checkpoint["label_classes"],
            "feature_cols": checkpoint["feature_cols"],
            "log_cols": checkpoint["log_cols"],
        }

class TabularDataset(Dataset):
    def __init__(self, data, labels):
        self.data = torch.tensor(data, dtype=torch.float32)
        self.labels = torch.tensor(labels, dtype=torch.long)

    def __len__(self):
        return len(self.data)

    def __getitem__(self, index):
        return self.data[index], self.labels[index]

class NeuralNetwork(nn.Module):
    def __init__(self, n_features, n_classes):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(n_features, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(0.3),

            nn.Linear(64, 32),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.Dropout(0.3),

            nn.Linear(32, n_classes),
        )


    def forward(self, x):
        return self.net(x)



