from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import mean_absolute_error
from sklearn.metrics import root_mean_squared_error
from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBRegressor


DATA_PATH = Path("data") / "full_2025_hybrid_dataset_with_rolling.csv"
MODEL_PATH = Path("models") / "xgboost_f1.pkl"
ENCODERS_PATH = Path("models") / "xgboost_feature_encoders.pkl"
PREDICTIONS_PATH = Path("data") / "xgboost_predictions.csv"

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

total_rows = len(df)
dnf_rows = int(df["DNF"].sum())
df = df[df["DNF"] == 0].copy()

X = df[features]
y = df["FinalPosition"]

groups = df["RaceName"]
splitter = GroupShuffleSplit(
    test_size=0.2,
    random_state=42,
)
train_idx, test_idx = next(splitter.split(X, y, groups=groups))

X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

model = XGBRegressor(
    n_estimators=500,
    learning_rate=0.03,
    max_depth=6,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=3,
    reg_alpha=0.1,
    reg_lambda=1.0,
    random_state=42,
)

model.fit(X_train, y_train)

predictions = model.predict(X_test)

mae = mean_absolute_error(y_test, predictions)
rmse = root_mean_squared_error(y_test, predictions)

results = pd.DataFrame(
    {
        "RaceName": df.iloc[test_idx]["RaceName"].values,
        "Driver": df.iloc[test_idx]["Driver"].values,
        "Actual": y_test.values,
        "Predicted": predictions,
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
print(f"Total rows: {total_rows}")
print(f"DNF rows excluded from position model: {dnf_rows}")
print(f"Finisher rows used: {len(df)}")
print(f"Train rows: {len(X_train)}")
print(f"Test rows: {len(X_test)}")
print(f"Test races: {test_races}")
print(f"MAE: {mae:.3f}")
print(f"RMSE: {rmse:.3f}")
print(f"Features: {features}")
print(results[["Actual", "Predicted"]].head(20))
print("Top 10 feature importances:")
print(feature_importance.head(10).to_string(index=False))
print(f"Saved model: {MODEL_PATH}")
print(f"Saved encoders: {ENCODERS_PATH}")
print(f"Saved predictions: {PREDICTIONS_PATH}")
