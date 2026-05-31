import argparse
from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INPUT = PROJECT_ROOT / "data" / "hybrid_canada_2025_dataset.csv"
DEFAULT_OUTPUT = PROJECT_ROOT / "data" / "hybrid_canada_2025_dataset_clean.csv"


def flag_practice_outliers(pace, threshold=5.0):
    median = pace.median()
    mad = (pace - median).abs().median()

    if pd.isna(mad) or mad == 0:
        return pd.Series(False, index=pace.index)

    robust_z_score = 0.6745 * (pace - median).abs() / mad
    return robust_z_score > threshold


def clean_dataset(df):
    cleaned = df.copy()

    cleaned["PracticePaceMissing"] = cleaned["BestPracticeLapSeconds"].isna()
    cleaned["PracticePaceOutlier"] = False

    has_practice_pace = cleaned["BestPracticeLapSeconds"].notna()
    for _, group in cleaned.loc[has_practice_pace].groupby(
        ["Year", "Round", "PracticeSession"]
    ):
        outliers = flag_practice_outliers(group["BestPracticeLapSeconds"])
        cleaned.loc[outliers.index, "PracticePaceOutlier"] = outliers

    invalid_pace = cleaned["PracticePaceMissing"] | cleaned["PracticePaceOutlier"]
    cleaned.loc[invalid_pace, "BestPracticeLapSeconds"] = pd.NA

    cleaned["BestPracticeLapSeconds"] = cleaned.groupby(
        ["Year", "Round"],
        dropna=False,
    )["BestPracticeLapSeconds"].transform(lambda series: series.fillna(series.median()))

    return cleaned


def parse_args():
    parser = argparse.ArgumentParser(
        description="Clean hybrid F1 dataset before model training."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def main():
    args = parse_args()
    df = pd.read_csv(args.input)
    cleaned = clean_dataset(df)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    cleaned.to_csv(args.output, index=False)

    print(f"Rows: {len(cleaned)}")
    print(f"Missing practice pace fixed: {int(cleaned['PracticePaceMissing'].sum())}")
    print(f"Practice pace outliers fixed: {int(cleaned['PracticePaceOutlier'].sum())}")
    print(f"Saved: {args.output}")


if __name__ == "__main__":
    main()
