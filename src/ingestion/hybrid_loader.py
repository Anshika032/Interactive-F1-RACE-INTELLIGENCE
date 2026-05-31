import argparse
from pathlib import Path

import fastf1
import pandas as pd
from fastf1.ergast import Ergast


PROJECT_ROOT = Path(__file__).resolve().parents[2]
CACHE_DIR = PROJECT_ROOT / "cache"
DEFAULT_OUTPUT = PROJECT_ROOT / "data" / "hybrid_f1_dataset.csv"


def full_name(row):
    return f"{row['givenName']} {row['familyName']}"


def get_race_results(ergast, year, race_round):
    response = ergast.get_race_results(season=year, round=race_round)
    race = response.content[0].copy()

    return pd.DataFrame(
        {
            "FullName": race.apply(full_name, axis=1),
            "Abbreviation": race["driverCode"],
            "Constructor": race["constructorName"],
            "Position": race["position"],
        }
    )


def get_qualifying_results(ergast, year, race_round):
    response = ergast.get_qualifying_results(season=year, round=race_round)
    qualifying = response.content[0].copy()

    return pd.DataFrame(
        {
            "Abbreviation": qualifying["driverCode"],
            "QualiPosition": qualifying["position"],
        }
    )


def get_practice_pace(year, race_name):
    # Sprint weekends often do not have FP2, so FP1 is the safest fallback.
    for session_name in ("FP2", "FP1"):
        try:
            session = fastf1.get_session(year, race_name, session_name)
            session.load()

            laps = session.laps
            best_laps = laps.groupby("Driver")["LapTime"].min().reset_index()
            best_laps.rename(
                columns={
                    "Driver": "Abbreviation",
                    "LapTime": "BestPracticeLap",
                },
                inplace=True,
            )
            best_laps["BestPracticeLapSeconds"] = best_laps[
                "BestPracticeLap"
            ].dt.total_seconds()
            best_laps["PracticeSession"] = session_name
            best_laps["PracticePosition"] = best_laps[
                "BestPracticeLapSeconds"
            ].rank(method="min").astype("Int64")

            return best_laps[
                [
                    "Abbreviation",
                    "BestPracticeLapSeconds",
                    "PracticeSession",
                    "PracticePosition",
                ]
            ]
        except Exception as exc:
            print(f"Practice pace unavailable: {year} {race_name} {session_name}: {exc}")

    return pd.DataFrame(
        columns=[
            "Abbreviation",
            "BestPracticeLapSeconds",
            "PracticeSession",
            "PracticePosition",
        ]
    )


def build_race_dataset(ergast, year, race):
    race_round = int(race["round"])
    race_name = race["raceName"]

    race_results = get_race_results(ergast, year, race_round)
    qualifying_results = get_qualifying_results(ergast, year, race_round)
    practice_pace = get_practice_pace(year, race_name)

    dataset = pd.merge(race_results, qualifying_results, on="Abbreviation")
    dataset = pd.merge(dataset, practice_pace, on="Abbreviation", how="left")

    dataset["Year"] = year
    dataset["Round"] = race_round
    dataset["RaceName"] = race_name

    return dataset[
        [
            "Year",
            "Round",
            "RaceName",
            "FullName",
            "Abbreviation",
            "Constructor",
            "QualiPosition",
            "BestPracticeLapSeconds",
            "PracticeSession",
            "PracticePosition",
            "Position",
        ]
    ]


def save_incrementally(frames, output_path):
    if not frames:
        return

    output_path.parent.mkdir(parents=True, exist_ok=True)
    pd.concat(frames, ignore_index=True).to_csv(output_path, index=False)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Build a hybrid F1 dataset using Jolpica/Ergast results and FastF1 practice pace."
    )
    parser.add_argument(
        "--years",
        nargs="+",
        type=int,
        default=[2025],
        help="Season years to load. Default: 2025",
    )
    parser.add_argument(
        "--round",
        type=int,
        default=None,
        help="Optional single race round to load for each selected year.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="CSV output path.",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    fastf1.Cache.enable_cache(str(CACHE_DIR))
    ergast = Ergast(result_type="pandas", auto_cast=True, limit=1000)

    all_data = []

    for year in args.years:
        schedule = ergast.get_race_schedule(season=year)
        if args.round is not None:
            schedule = schedule[schedule["round"] == args.round]

        for _, race in schedule.iterrows():
            try:
                race_dataset = build_race_dataset(ergast, year, race)
                all_data.append(race_dataset)
                save_incrementally(all_data, args.output)

                print(f"Loaded {year} round {race['round']} - {race['raceName']}")
            except Exception as exc:
                print(f"Skipped {year} round {race['round']} - {race['raceName']}: {exc}")

    if not all_data:
        raise RuntimeError("No race data was loaded.")

    save_incrementally(all_data, args.output)
    print(f"Done! Saved {args.output}")


if __name__ == "__main__":
    main()
