from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import accuracy_score
from sklearn.metrics import f1_score
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier


DATA_PATH = Path("data") / "full_2025_hybrid_dataset_with_rolling.csv"
MODEL_PATH = Path("models") / "xgboost_dnf_classifier.pkl"
ENCODERS_PATH = Path("models") / "xgboost_dnf_feature_encoders.pkl"
PREDICTIONS_PATH = Path("data") / "xgboost_dnf_predictions.csv"

features = [
    "Round",
    "GridPosition",
    "QualiPosition",
    "QualiDeltaToPole",
    "BestPracticeLapSeconds",
    "PracticeDeltaToFastest",
    "PracticePosition",
    "PracticePaceMissing",
    "ConstructorEncoded",
    "TrackEncoded",
    "DriverForm",
    "ConstructorForm",
    "TrackHistory",
    "GainPotential",
]

numeric_features = [
    "Round",
    "GridPosition",
    "QualiPosition",
    "QualiDeltaToPole",
    "BestPracticeLapSeconds",
    "PracticeDeltaToFastest",
    "PracticePosition",
    "DriverForm",
    "ConstructorForm",
    "TrackHistory",
    "GainPotential",
]


df = pd.read_csv(DATA_PATH)

constructor_encoder = LabelEncoder()
track_encoder = LabelEncoder()

df["ConstructorEncoded"] = constructor_encoder.fit_transform(
    df["Constructor"].fillna("Unknown").astype(str)
)
df["TrackEncoded"] = track_encoder.fit_transform(
    df["Track"].fillna("Unknown").astype(str)
)
df["PracticePaceMissing"] = df["PracticePaceMissing"].fillna(False).astype(int)

for column in numeric_features:
    race_medians = df.groupby("RaceName")[column].transform("median")
    global_median = df[column].median()
    if pd.isna(global_median):
        global_median = 0

    df[column] = df[column].fillna(race_medians).fillna(global_median)

X = df[features]
y = df["DNF"].astype(int)

groups = df["RaceName"]
splitter = GroupShuffleSplit(
    test_size=0.2,
    random_state=42,
)
train_idx, test_idx = next(splitter.split(X, y, groups=groups))

X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

negative_count = int((y_train == 0).sum())
positive_count = int((y_train == 1).sum())
scale_pos_weight = negative_count / positive_count if positive_count else 1

model = XGBClassifier(
    n_estimators=400,
    learning_rate=0.03,
    max_depth=4,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=3,
    reg_alpha=0.1,
    reg_lambda=1.0,
    scale_pos_weight=scale_pos_weight,
    random_state=42,
    eval_metric="logloss",
)

model.fit(X_train, y_train)

predictions = model.predict(X_test)
probabilities = model.predict_proba(X_test)[:, 1]

accuracy = accuracy_score(y_test, predictions)
f1 = f1_score(y_test, predictions, zero_division=0)
roc_auc = roc_auc_score(y_test, probabilities)

results = pd.DataFrame(
    {
        "RaceName": df.iloc[test_idx]["RaceName"].values,
        "Driver": df.iloc[test_idx]["Driver"].values,
        "ActualDNF": y_test.values,
        "PredictedDNF": predictions,
        "DNFProbability": probabilities,
    }
)

feature_importance = pd.DataFrame(
    {
        "Feature": features,
        "Importance": model.feature_importances_,
    }
).sort_values("Importance", ascending=False)

MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
PREDICTIONS_PATH.parent.mkdir(parents=True, exist_ok=True)

joblib.dump(model, MODEL_PATH)
joblib.dump(
    {
        "Constructor": constructor_encoder,
        "Track": track_encoder,
        "features": features,
        "numeric_imputation_columns": numeric_features,
        "dataset": str(DATA_PATH),
    },
    ENCODERS_PATH,
)
results.to_csv(PREDICTIONS_PATH, index=False)

test_races = sorted(df.iloc[test_idx]["RaceName"].unique())

print(f"Dataset: {DATA_PATH}")
print(f"Total rows: {len(df)}")
print(f"Train rows: {len(X_train)}")
print(f"Test rows: {len(X_test)}")
print(f"Train DNFs: {positive_count}")
print(f"Test DNFs: {int(y_test.sum())}")
print(f"Test races: {test_races}")
print(f"Accuracy: {accuracy:.3f}")
print(f"F1: {f1:.3f}")
print(f"ROC-AUC: {roc_auc:.3f}")
print(results.head(20))
print("Top 10 feature importances:")
print(feature_importance.head(10).to_string(index=False))
print(f"Saved model: {MODEL_PATH}")
print(f"Saved encoders: {ENCODERS_PATH}")
print(f"Saved predictions: {PREDICTIONS_PATH}")
