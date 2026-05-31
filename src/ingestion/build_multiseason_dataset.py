import argparse
import time
from pathlib import Path

import fastf1
import pandas as pd
from fastf1.ergast import Ergast


PROJECT_ROOT = Path(__file__).resolve().parents[2]
CACHE_DIR = PROJECT_ROOT / "cache"
DATA_DIR = PROJECT_ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
FEATURES_DIR = DATA_DIR / "features"
DEFAULT_OUTPUT = DATA_DIR / "full_multiseason_dataset.csv"
DEFAULT_SEASONS = [2022, 2023, 2024, 2025]
PRACTICE_SESSIONS = ["FP1", "FP2", "FP3"]

FINAL_COLUMNS = [
    "Season",
    "Round",
    "RaceName",
    "Driver",
    "Constructor",
    "GridPosition",
    "QualiPosition",
    "QualiDeltaToPole",
    "BestPracticeLapSeconds",
    "PracticePosition",
    "PracticeDeltaToFastest",
    "FinalPosition",
    "Points",
    "Status",
    "DNF",
]

REQUEST_ATTEMPTS = 4
REQUEST_RETRY_SECONDS = 8


def ensure_data_dirs():
    for directory in [RAW_DIR, PROCESSED_DIR, FEATURES_DIR]:
        directory.mkdir(parents=True, exist_ok=True)

    for season in DEFAULT_SEASONS:
        (RAW_DIR / str(season)).mkdir(parents=True, exist_ok=True)


def full_name(row):
    return f"{row['givenName']} {row['familyName']}"


def timedelta_to_seconds(series):
    return pd.to_timedelta(series, errors="coerce").dt.total_seconds()


def is_dnf(status):
    status_text = str(status)
    if status_text == "Finished":
        return 0
    if "Lap" in status_text:
        return 0
    return 1


def with_retries(description, loader):
    last_error = None

    for attempt in range(1, REQUEST_ATTEMPTS + 1):
        try:
            return loader()
        except Exception as exc:
            last_error = exc
            if attempt == REQUEST_ATTEMPTS:
                break

            print(
                f"Retrying {description} after error "
                f"({attempt}/{REQUEST_ATTEMPTS}): {exc}"
            )
            time.sleep(REQUEST_RETRY_SECONDS)

    raise last_error


def load_race_results(ergast, year, race_round):
    response = with_retries(
        f"{year} round {race_round} race results",
        lambda: ergast.get_race_results(season=year, round=race_round),
    )
    race = response.content[0].copy()

    return pd.DataFrame(
        {
            "Driver": race.apply(full_name, axis=1),
            "Abbreviation": race["driverCode"],
            "Constructor": race["constructorName"],
            "GridPosition": pd.to_numeric(race["grid"], errors="coerce"),
            "FinalPosition": pd.to_numeric(race["position"], errors="coerce"),
            "Points": pd.to_numeric(race["points"], errors="coerce"),
            "Status": race["status"],
            "DNF": race["status"].apply(is_dnf),
        }
    )


def load_qualifying_results(ergast, year, race_round):
    response = with_retries(
        f"{year} round {race_round} qualifying",
        lambda: ergast.get_qualifying_results(season=year, round=race_round),
    )
    qualifying = response.content[0].copy()

    q1_seconds = timedelta_to_seconds(qualifying["Q1"])
    q2_seconds = timedelta_to_seconds(qualifying["Q2"])
    q3_seconds = timedelta_to_seconds(qualifying["Q3"])
    best_quali = pd.concat([q1_seconds, q2_seconds, q3_seconds], axis=1).min(axis=1)
    pole_time = best_quali.loc[qualifying["position"] == 1].min()

    return pd.DataFrame(
        {
            "Abbreviation": qualifying["driverCode"],
            "QualiPosition": pd.to_numeric(qualifying["position"], errors="coerce"),
            "QualiDeltaToPole": best_quali - pole_time,
        }
    )


def load_practice_session(year, race_name, session_name):
    session = fastf1.get_session(year, race_name, session_name)
    session.load(laps=True, telemetry=False, weather=False, messages=False)

    laps = session.laps
    if laps.empty:
        return pd.DataFrame(columns=["Abbreviation", f"{session_name}LapSeconds"])

    best_laps = laps.groupby("Driver")["LapTime"].min().reset_index()
    best_laps.rename(columns={"Driver": "Abbreviation"}, inplace=True)
    best_laps[f"{session_name}LapSeconds"] = best_laps["LapTime"].dt.total_seconds()

    return best_laps[["Abbreviation", f"{session_name}LapSeconds"]]


def load_practice_results(year, race_name):
    practice_frames = []

    for session_name in PRACTICE_SESSIONS:
        try:
            practice_frames.append(load_practice_session(year, race_name, session_name))
        except Exception as exc:
            print(f"Skipped practice: {year} {race_name} {session_name}: {exc}")

    if not practice_frames:
        return pd.DataFrame(
            columns=[
                "Abbreviation",
                "BestPracticeLapSeconds",
                "PracticePosition",
                "PracticeDeltaToFastest",
            ]
        )

    practice = practice_frames[0]
    for frame in practice_frames[1:]:
        practice = pd.merge(practice, frame, on="Abbreviation", how="outer")

    lap_columns = [
        f"{session_name}LapSeconds"
        for session_name in PRACTICE_SESSIONS
        if f"{session_name}LapSeconds" in practice.columns
    ]

    practice["BestPracticeLapSeconds"] = practice[lap_columns].min(axis=1)
    practice["PracticePosition"] = practice["BestPracticeLapSeconds"].rank(
        method="min"
    )
    practice["PracticeDeltaToFastest"] = (
        practice["BestPracticeLapSeconds"] - practice["BestPracticeLapSeconds"].min()
    )

    return practice[
        [
            "Abbreviation",
            "BestPracticeLapSeconds",
            "PracticePosition",
            "PracticeDeltaToFastest",
        ]
    ]


def normalize_race_dataset(year, race_round, race_name, race_results, qualifying, practice):
    dataset = pd.merge(race_results, qualifying, on="Abbreviation", how="left")
    dataset = pd.merge(dataset, practice, on="Abbreviation", how="left")

    dataset["Season"] = year
    dataset["Round"] = race_round
    dataset["RaceName"] = race_name

    for column in FINAL_COLUMNS:
        if column not in dataset.columns:
            dataset[column] = pd.NA

    return dataset[FINAL_COLUMNS]


def save_raw_frame(year, name, frame):
    output_path = RAW_DIR / str(year) / f"{name}.csv"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(output_path, index=False)


def add_race_metadata(frame, year, race_round, race_name):
    frame = frame.copy()
    frame["Season"] = year
    frame["Round"] = race_round
    frame["RaceName"] = race_name
    return frame


def load_season_data(year: int):
    ensure_data_dirs()

    ergast = Ergast(result_type="pandas", auto_cast=True, limit=1000)
    schedule_path = RAW_DIR / str(year) / "schedule.csv"
    if schedule_path.exists():
        schedule = pd.read_csv(schedule_path)
    else:
        schedule = with_retries(
            f"{year} race schedule",
            lambda: ergast.get_race_schedule(season=year),
        )
        save_raw_frame(year, "schedule", schedule)

    season_frames = []
    raw_race_results = []
    raw_qualifying = []
    raw_practice = []
    partial_path = RAW_DIR / str(year) / "merged_partial.csv"
    loaded_rounds = set()

    if partial_path.exists():
        existing = pd.read_csv(partial_path)
        if not existing.empty:
            season_frames.append(existing[FINAL_COLUMNS])
            loaded_rounds = set(existing["Round"].dropna().astype(int))
            print(f"Resuming {year}; already loaded rounds: {sorted(loaded_rounds)}")

    for _, race in schedule.iterrows():
        race_round = int(race["round"])
        race_name = race["raceName"]

        if race_round in loaded_rounds:
            continue

        try:
            race_results = load_race_results(ergast, year, race_round)
            qualifying = load_qualifying_results(ergast, year, race_round)
            practice = load_practice_results(year, race_name)

            race_results_raw = add_race_metadata(
                race_results,
                year,
                race_round,
                race_name,
            )
            qualifying_raw = add_race_metadata(
                qualifying,
                year,
                race_round,
                race_name,
            )
            practice_raw = add_race_metadata(
                practice,
                year,
                race_round,
                race_name,
            )

            raw_race_results.append(race_results_raw)
            raw_qualifying.append(qualifying_raw)
            raw_practice.append(practice_raw)

            race_dataset = normalize_race_dataset(
                year,
                race_round,
                race_name,
                race_results,
                qualifying,
                practice,
            )
            season_frames.append(race_dataset)
            season_partial = pd.concat(season_frames, ignore_index=True)
            season_partial = season_partial.sort_values(
                ["Season", "Round"]
            ).reset_index(drop=True)
            save_raw_frame(year, "merged_partial", season_partial)

            print(f"Loaded {year} round {race_round} - {race_name}")
        except Exception as exc:
            print(f"Skipped {year} round {race_round} - {race_name}: {exc}")

    if not season_frames:
        raise RuntimeError(f"No race data was loaded for {year}.")

    if raw_race_results:
        save_raw_frame(year, "race_results", pd.concat(raw_race_results, ignore_index=True))
    if raw_qualifying:
        save_raw_frame(year, "qualifying", pd.concat(raw_qualifying, ignore_index=True))
    if raw_practice:
        save_raw_frame(year, "practice", pd.concat(raw_practice, ignore_index=True))

    season_df = pd.concat(season_frames, ignore_index=True)
    return season_df.sort_values(["Season", "Round"]).reset_index(drop=True)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Build a normalized multi-season F1 dataset without engineered features."
    )
    parser.add_argument(
        "--seasons",
        nargs="+",
        type=int,
        default=DEFAULT_SEASONS,
        help="Seasons to load. Default: 2022 2023 2024 2025",
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

    ensure_data_dirs()
    fastf1.Cache.enable_cache(str(CACHE_DIR))

    all_data = []
    for year in args.seasons:
        season_df = load_season_data(year)
        all_data.append(season_df)

        incremental = pd.concat(all_data, ignore_index=True)
        incremental = incremental.sort_values(["Season", "Round"]).reset_index(drop=True)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        incremental.to_csv(args.output, index=False)

    final_df = pd.concat(all_data, ignore_index=True)
    final_df = final_df.sort_values(["Season", "Round"]).reset_index(drop=True)
    final_df.to_csv(args.output, index=False)

    processed_output = PROCESSED_DIR / args.output.name
    final_df.to_csv(processed_output, index=False)

    print(f"Done! Saved {args.output}")
    print(f"Saved processed copy: {processed_output}")
    print(f"Rows: {len(final_df)}")
    print(f"Seasons: {sorted(final_df['Season'].unique())}")
    print(f"Races: {final_df[['Season', 'Round']].drop_duplicates().shape[0]}")


if __name__ == "__main__":
    main()
