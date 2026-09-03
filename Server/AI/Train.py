import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import GroupShuffleSplit
from sklearn.utils.class_weight import compute_class_weight
from Vortex import NeuralNetwork, TabularDataset

"""

NOTE:-

This Script was solely used for training

This Script is NOT used anywhere in this project

Everything will work fine without this script

"""

# --- Configurations & Constants ---
SEED = 42
DATA_FILE = 'AI_dataset_labeled.csv'
NUMERIC_COLS = [
    "pct_unique", "pct_missing", "pct_numeric", "n_unique", "n_unique_capped",
    "avg_str_len", "pct_dateish", "is_boolean_like", "is_integer",
    "is_monotonic", "is_id_like", "row_count", "mean", "std", "skew",
]
LOG_COLS = ["n_unique", "n_unique_capped", "row_count", "avg_str_len"]
TARGET_COL = "final_label"
GROUP_COL = "dataset"

device = torch.accelerator.current_accelerator().type if torch.accelerator.is_available() else "cpu"

# --- Data Preparation Functions ---
def prep_data(file_path: str):
    df = pd.read_csv(file_path).dropna(subset=[TARGET_COL]).reset_index(drop=True)

    X = df[NUMERIC_COLS].copy()
    for c in LOG_COLS:
        X[c] = np.log1p(X[c].clip(lower=0.0))

    X = X.fillna(0.0).replace([np.inf, -np.inf], 0.0)
    return X.values.astype(np.float32), df[TARGET_COL].values, df[GROUP_COL].values


def split_by_group(X, y, groups, test_size=0.15, val_size=0.15, seed=SEED):
    gss1 = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=seed)
    trainval_idx, test_idx = next(gss1.split(X, y, groups))

    gss2 = GroupShuffleSplit(n_splits=1, test_size=val_size / (1 - test_size), random_state=seed)
    train_idx_rel, val_idx_rel = next(gss2.split(X[trainval_idx], y[trainval_idx], groups[trainval_idx]))

    return trainval_idx[train_idx_rel], trainval_idx[val_idx_rel], test_idx

# --- Training & Evaluation Functions ---
def train_model(model: nn.Module, train_loader, val_loader, device, class_weights, epochs=200, lr=1e-3, patience=20):
    criterion = nn.CrossEntropyLoss(weight=class_weights.to(device))
    optimizer = torch.optim.Adam(model.parameters(), weight_decay=1e-4, lr=lr)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="min", factor=0.5, patience=5)

    best_val_loss = float('inf')
    best_state = None
    epochs_no_improve = 0

    for epoch in range(1, epochs + 1):
        model.train()
        for xb, yb in train_loader:
            xb, yb = xb.to(device), yb.to(device)
            optimizer.zero_grad()
            loss = criterion(model(xb), yb)
            loss.backward()
            optimizer.step()

        model.eval()
        val_loss, correct, total = 0.0, 0, 0
        with torch.no_grad():
            for xb, yb in val_loader:
                xb, yb = xb.to(device), yb.to(device)
                logits = model(xb)
                val_loss += criterion(logits, yb).item() * len(xb)
                correct += (logits.argmax(1) == yb).sum().item()
                total += len(xb)

        val_loss /= total
        val_acc = correct / total
        scheduler.step(val_loss)

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
            epochs_no_improve = 0
        else:
            epochs_no_improve += 1
            if epoch % 10 == 0 or epoch == 1:
                print(f"Epoch {epoch:3d} | Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.3f}")

            if epochs_no_improve > patience:
                print(f"Early stopping at epoch {epoch} (Best Val Loss: {best_val_loss:.4f})")
                break

    model.load_state_dict(best_state)
    return model


def evaluate(model, loader, device, label_encoder):
    model.eval()
    all_preds, all_true = [], []
    with torch.no_grad():
        for xb, yb in loader:
            xb = xb.to(device)
            preds = model(xb).argmax(1).cpu().numpy()
            all_preds.extend(preds)
            all_true.extend(yb.numpy())

    # Evaluation metrics printed once outside batch loop
    print(classification_report(all_true, all_preds, target_names=label_encoder.classes_))
    print("Confusion Matrix:")
    print(pd.DataFrame(
        confusion_matrix(all_true, all_preds),
        index=label_encoder.classes_,
        columns=label_encoder.classes_
    ))

# --- Main Pipeline ---
def main():
    X, y_raw, groups = prep_data(DATA_FILE)
    label_encoder = LabelEncoder()
    labels = label_encoder.fit_transform(y_raw)

    train_idx, val_idx, test_idx = split_by_group(X, labels, groups)
    X_train, X_val, X_test = X[train_idx], X[val_idx], X[test_idx]
    y_train, y_val, y_test = labels[train_idx], labels[val_idx], labels[test_idx]

    scaler = StandardScaler().fit(X_train)
    X_train, X_val, X_test = scaler.transform(X_train), scaler.transform(X_val), scaler.transform(X_test)

    class_weights = torch.tensor(compute_class_weight("balanced", classes=np.unique(y_train), y=y_train), dtype=torch.float32)

    train_loader = DataLoader(TabularDataset(X_train, y_train), batch_size=64, shuffle=True)
    val_loader = DataLoader(TabularDataset(X_val, y_val), batch_size=128)
    test_loader = DataLoader(TabularDataset(X_test, y_test), batch_size=128)

    model = NeuralNetwork(n_features=X.shape[1], n_classes=len(label_encoder.classes_)).to(device)
    model = train_model(model, train_loader, val_loader, device, class_weights)

    print("\n=== Test Set Performance ===")
    evaluate(model, test_loader, device, label_encoder)

    torch.save({
        "model_state": model.state_dict(),
        "scaler_mean": scaler.mean_,
        "scaler_scale": scaler.scale_,
        "label_classes": label_encoder.classes_,
        "feature_cols": NUMERIC_COLS,
        "log_cols": LOG_COLS,
    }, "../model.pth")
    print("\nSaved model + preprocessing to model.pth")

if __name__ == "__main__":
    main()
