import argparse
from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INPUT = PROJECT_ROOT / "data" / "full_2025_hybrid_dataset.csv"
DEFAULT_OUTPUT = PROJECT_ROOT / "data" / "full_2025_hybrid_dataset_with_rolling.csv"


def shifted_rolling_mean(series, window=5):
    return series.shift(1).rolling(window=window, min_periods=1).mean()


def shifted_expanding_mean(series):
    return series.shift(1).expanding(min_periods=1).mean()


def build_rolling_features(df):
    featured = df.copy()
    featured = featured.sort_values(["Year", "Round", "Driver"]).reset_index(drop=True)

    featured["DriverForm"] = featured.groupby("Driver", group_keys=False)[
        "FinalPosition"
    ].transform(shifted_rolling_mean)

    constructor_race_form = (
        featured.groupby(["Constructor", "Year", "Round"], as_index=False)[
            "FinalPosition"
        ]
        .mean()
        .sort_values(["Constructor", "Year", "Round"])
    )
    constructor_race_form["ConstructorForm"] = constructor_race_form.groupby(
        "Constructor",
        group_keys=False,
    )["FinalPosition"].transform(shifted_rolling_mean)
    featured = pd.merge(
        featured,
        constructor_race_form[["Constructor", "Year", "Round", "ConstructorForm"]],
        on=["Constructor", "Year", "Round"],
        how="left",
    )

    featured["TrackHistory"] = featured.groupby(
        ["Driver", "Track"],
        group_keys=False,
    )["FinalPosition"].transform(shifted_expanding_mean)

    featured["GainPotential"] = featured["GridPosition"] - featured["PracticePosition"]

    # First appearances have no prior history; neutral fallback keeps rows usable.
    featured["DriverForm"] = featured["DriverForm"].fillna(featured["FinalPosition"].median())
    featured["ConstructorForm"] = featured["ConstructorForm"].fillna(
        featured["FinalPosition"].median()
    )
    featured["TrackHistory"] = featured["TrackHistory"].fillna(
        featured["FinalPosition"].median()
    )
    featured["GainPotential"] = featured["GainPotential"].fillna(0)

    return featured


def parse_args():
    parser = argparse.ArgumentParser(
        description="Add leakage-safe rolling historical features to F1 dataset."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def main():
    args = parse_args()
    df = pd.read_csv(args.input)
    featured = build_rolling_features(df)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    featured.to_csv(args.output, index=False)

    print(f"Rows: {len(featured)}")
    print(f"Columns: {len(featured.columns)}")
    print("Added: DriverForm, ConstructorForm, TrackHistory, GainPotential")
    print(f"Saved: {args.output}")


if __name__ == "__main__":
    main()
