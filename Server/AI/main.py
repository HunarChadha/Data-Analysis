import pandas as pd
import io
import torch
from sklearn.preprocessing import StandardScaler
from . import Extract
from . import Vortex
from .Vortex import  NeuralNetwork
from . import ManipulateData

#Number of features of data AI was trained on
N_FEATURES = 15
#Number of distuinguish AI can make
N_CLASSES = 5
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("using: ", device)


class Network:
    @staticmethod
    def model():
        model = NeuralNetwork(n_features=N_FEATURES, n_classes=N_CLASSES)
        model_properties = Vortex.load_model('model.pth', model)
        return model_properties

class ConvertData:
    @staticmethod
    def convert(data: bytes, filetype:str) -> tuple[dict, "pd.DataFrame"]:
        """Extract features for every column in the uploaded file.

        Returns {column_name: feature_dict}. Passes the column name into
        extract_features so the name_hints_id logic used at training runs.
        """
        data = io.BytesIO(data)
        ft = (filetype or '').lower()
        if 'json' in ft:
            df = pd.read_json(data)
        elif 'tab-separated' in ft:
            df = pd.read_csv(data, sep='\t')
        elif 'csv' in ft or 'text/plain' in ft:
            df = pd.read_csv(data)
        else:
            df = pd.read_excel(data)
        out = {}
        for col in df.columns:
            out[str(col)] = Extract.extract_features(df[col], col_name=str(col))
        return out, df


class Main:
    @staticmethod
    def main(data: bytes, filetype:str) -> dict:
        if filetype is None:
            raise Exception("Error")
        # 1. Load model + preprocessing bundle
        props = Network.model()
        model = props["model"]
        model.eval()

        # 2. Rebuild the scaler from saved stats — do NOT refit
        scaler = StandardScaler()
        scaler.mean_ = props["scaler_mean"]
        scaler.scale_ = props["scaler_scale"]
        feature_cols = props["feature_cols"]
        log_cols = props["log_cols"]
        label_classes = props["label_classes"]

        # 3. Extract features per column
        feature_dicts, data_panda = ConvertData.convert(data, filetype)

        # 4. Prep -> scale -> predict for each column
        #    results      = {col: label_string}   -> used by DownData (unchanged)
        #    confidences  = {col: {label, confidence, all_classes}}  -> for inspection
        results = {}
        confidences = {}
        for col, feat in feature_dicts.items():
            if feat is None:           # fully empty column, extract_features skipped it
                continue
            x = Vortex.prep_data(feat, feature_cols, log_cols)   # reorder + log1p + nan cleanup
            x = scaler.transform(x)                                 # same scaling as training
            with torch.no_grad():
                logits = model(torch.tensor(x, dtype=torch.float32))   # [1, n_classes] raw scores
                probs = torch.softmax(logits, dim=1)[0]                # one probability per class
                conf, idx = torch.max(probs, dim=0)
                # map every class index -> {class_name: probability}
                class_probs = {
                    str(label_classes[i]): round(float(probs[i]), 4)
                    for i in range(len(label_classes))
                }
            label = str(label_classes[idx])
            results[col] = label
            confidences[col] = {
                "label": label,
                "confidence": round(float(conf), 4),
                "all_classes": class_probs,
            }

        return {'results': ManipulateData.main(data_panda, results)}


