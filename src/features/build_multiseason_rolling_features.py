import pandas as pd


INPUT_PATH = "data/full_multiseason_dataset.csv"
OUTPUT_PATH = "data/full_multiseason_dataset_with_rolling.csv"


df = pd.read_csv(INPUT_PATH)

df = df.sort_values(["Season", "Round"])

df["DriverForm"] = (
    df.groupby("Driver")["FinalPosition"].transform(
        lambda x: x.shift(1).rolling(5, min_periods=1).mean()
    )
)

df["ConstructorForm"] = (
    df.groupby("Constructor")["FinalPosition"].transform(
        lambda x: x.shift(1).rolling(5, min_periods=1).mean()
    )
)

df["TrackHistory"] = (
    df.groupby(["Driver", "RaceName"])["FinalPosition"].transform(
        lambda x: x.shift(1).expanding().mean()
    )
)

df["GainPotential"] = df["GridPosition"] - df["PracticePosition"]

rolling_cols = [
    "DriverForm",
    "ConstructorForm",
    "TrackHistory",
]

df[rolling_cols] = df[rolling_cols].fillna(df[rolling_cols].median())

df.to_csv(
    OUTPUT_PATH,
    index=False,
)

print(f"Rows: {len(df)}")
print(f"Columns: {len(df.columns)}")
print("Added: DriverForm, ConstructorForm, TrackHistory, GainPotential")
print(f"Saved: {OUTPUT_PATH}")
