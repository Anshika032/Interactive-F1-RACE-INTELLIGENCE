import argparse
from pathlib import Path

import joblib
import pandas as pd
from sklearn.preprocessing import LabelEncoder


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INPUT = PROJECT_ROOT / "data" / "hybrid_f1_dataset_clean.csv"
DEFAULT_OUTPUT = PROJECT_ROOT / "data" / "hybrid_f1_features.csv"
DEFAULT_ENCODERS = PROJECT_ROOT / "models" / "feature_encoders.pkl"

FEATURE_COLUMNS = [
    "QualiPosition",
    "BestPracticeLapSeconds",
    "ConstructorEncoded",
    "PracticeSessionEncoded",
    "PracticePaceMissing",
    "PracticePaceOutlier",
]


def encode_column(df, column, output_column):
    encoder = LabelEncoder()
    values = df[column].fillna("Unknown").astype(str)
    df[output_column] = encoder.fit_transform(values)
    return encoder


def build_features(df):
    featured = df.copy()

    if "PracticePaceMissing" not in featured.columns:
        featured["PracticePaceMissing"] = featured["BestPracticeLapSeconds"].isna()

    if "PracticePaceOutlier" not in featured.columns:
        featured["PracticePaceOutlier"] = False

    constructor_encoder = encode_column(
        featured,
        "Constructor",
        "ConstructorEncoded",
    )
    practice_session_encoder = encode_column(
        featured,
        "PracticeSession",
        "PracticeSessionEncoded",
    )

    featured["PracticePaceMissing"] = featured["PracticePaceMissing"].astype(int)
    featured["PracticePaceOutlier"] = featured["PracticePaceOutlier"].astype(int)

    output_columns = FEATURE_COLUMNS + ["Position"]
    return featured[output_columns], {
        "Constructor": constructor_encoder,
        "PracticeSession": practice_session_encoder,
        "features": FEATURE_COLUMNS,
    }


def parse_args():
    parser = argparse.ArgumentParser(
        description="Build encoded training features for the F1 model."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--encoders", type=Path, default=DEFAULT_ENCODERS)
    return parser.parse_args()


def main():
    args = parse_args()
    df = pd.read_csv(args.input)
    features, encoders = build_features(df)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.encoders.parent.mkdir(parents=True, exist_ok=True)

    features.to_csv(args.output, index=False)
    joblib.dump(encoders, args.encoders)

    print(f"Rows: {len(features)}")
    print(f"Features: {FEATURE_COLUMNS}")
    print(f"Saved features: {args.output}")
    print(f"Saved encoders: {args.encoders}")


if __name__ == "__main__":
    main()
