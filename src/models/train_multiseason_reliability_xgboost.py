from pathlib import Path

import joblib
import pandas as pd

from sklearn.metrics import mean_absolute_error, root_mean_squared_error
from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import LabelEncoder

from xgboost import XGBRegressor


# =========================
# PATHS
# =========================

DATA_PATH = Path("data") / "full_multiseason_dataset_reliability.csv"

MODEL_PATH = Path("models") / "xgboost_multiseason_reliability.pkl"

ENCODERS_PATH = Path("models") / "multiseason_reliability_encoders.pkl"


# =========================
# LOAD DATA
# =========================

df = pd.read_csv(DATA_PATH)

print(f"Loaded dataset: {df.shape}")


# =========================
# REMOVE DNF ROWS
# =========================

df = df[df["DNF"] == 0].copy()

print(f"After removing DNFs: {df.shape}")


# =========================
# LABEL ENCODING
# =========================

driver_encoder = LabelEncoder()
constructor_encoder = LabelEncoder()
track_encoder = LabelEncoder()

df["DriverEncoded"] = driver_encoder.fit_transform(df["Driver"])

df["ConstructorEncoded"] = constructor_encoder.fit_transform(
    df["Constructor"]
)

df["TrackEncoded"] = track_encoder.fit_transform(
    df["RaceName"]
)


# =========================
# FEATURES
# =========================

features = [
    "Round",

    "GridPosition",
    "QualiPosition",
    "QualiDeltaToPole",

    "BestPracticeLapSeconds",
    "PracticePosition",
    "PracticeDeltaToFastest",

    "DriverForm",
    "ConstructorForm",
    "TrackHistory",
    "GainPotential",

    "DriverDNFRate",
    "ConstructorDNFRate",
    "ReliabilityScore",

    "DriverEncoded",
    "ConstructorEncoded",
    "TrackEncoded"
]


target = "FinalPosition"


X = df[features]
y = df[target]

groups = df["RaceName"]


# =========================
# LEAKAGE SAFE SPLIT
# =========================

gss = GroupShuffleSplit(
    n_splits=1,
    test_size=0.2,
    random_state=42
)

train_idx, test_idx = next(
    gss.split(X, y, groups)
)

X_train = X.iloc[train_idx]
X_test = X.iloc[test_idx]

y_train = y.iloc[train_idx]
y_test = y.iloc[test_idx]


print(f"Train rows: {len(X_train)}")
print(f"Test rows: {len(X_test)}")


# =========================
# MODEL
# =========================

model = XGBRegressor(
    n_estimators=700,
    max_depth=6,
    learning_rate=0.025,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42
)


# =========================
# TRAIN
# =========================

model.fit(X_train, y_train)


# =========================
# PREDICT
# =========================

preds = model.predict(X_test)


# =========================
# METRICS
# =========================

mae = mean_absolute_error(y_test, preds)

rmse = root_mean_squared_error(y_test, preds)

print("\n===== RESULTS =====")

print(f"MAE:  {mae:.3f}")
print(f"RMSE: {rmse:.3f}")


# =========================
# FEATURE IMPORTANCE
# =========================

importance_df = pd.DataFrame({
    "Feature": features,
    "Importance": model.feature_importances_
}).sort_values(
    by="Importance",
    ascending=False
)

print("\n===== FEATURE IMPORTANCE =====")

print(importance_df)


# =========================
# SAVE MODEL
# =========================

joblib.dump(model, MODEL_PATH)

joblib.dump(
    {
        "driver_encoder": driver_encoder,
        "constructor_encoder": constructor_encoder,
        "track_encoder": track_encoder
    },
    ENCODERS_PATH
)

print("\nModel saved.")
print("Encoders saved.")