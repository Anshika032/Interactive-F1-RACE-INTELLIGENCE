import pandas as pd


# =========================
# LOAD DATASET
# =========================

df = pd.read_csv(
    "data/full_multiseason_dataset_with_rolling.csv"
)

print("Loaded:", df.shape)


# =========================
# SORT TEMPORALLY
# =========================

df = df.sort_values(["Season", "Round"])


# =========================
# DRIVER DNF RATE
# =========================

df["DriverDNFRate"] = (
    df.groupby("Driver")["DNF"]
    .transform(
        lambda x: x.shift(1).rolling(10, min_periods=1).mean()
    )
)


# =========================
# CONSTRUCTOR DNF RATE
# =========================

df["ConstructorDNFRate"] = (
    df.groupby("Constructor")["DNF"]
    .transform(
        lambda x: x.shift(1).rolling(10, min_periods=1).mean()
    )
)


# =========================
# RELIABILITY SCORE
# =========================

df["ReliabilityScore"] = (
    1
    - (
        df["DriverDNFRate"]
        + df["ConstructorDNFRate"]
    ) / 2
)


# =========================
# FILL EARLY NaNs
# =========================

cols = [
    "DriverDNFRate",
    "ConstructorDNFRate",
    "ReliabilityScore"
]

df[cols] = df[cols].fillna(
    df[cols].median()
)


# =========================
# SAVE DATASET
# =========================

OUTPUT_PATH = (
    "data/full_multiseason_dataset_reliability.csv"
)

df.to_csv(OUTPUT_PATH, index=False)

print("\nSaved dataset:")
print(OUTPUT_PATH)

print("\nFinal shape:")
print(df.shape)