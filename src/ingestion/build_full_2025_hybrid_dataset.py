from pathlib import Path

import fastf1
import pandas as pd
from fastf1.ergast import Ergast


PROJECT_ROOT = Path(__file__).resolve().parents[2]
CACHE_DIR = PROJECT_ROOT / "cache"
OUTPUT_PATH = PROJECT_ROOT / "data" / "full_2025_hybrid_dataset.csv"
YEAR = 2025
PRACTICE_SESSIONS = ["FP1", "FP2", "FP3"]


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


def load_race_results(ergast, race_round):
    response = ergast.get_race_results(season=YEAR, round=race_round)
    race = response.content[0].copy()

    return pd.DataFrame(
        {
            "Driver": race.apply(full_name, axis=1),
            "Abbreviation": race["driverCode"],
            "Constructor": race["constructorName"],
            "GridPosition": race["grid"],
            "FinalPosition": race["position"],
            "Points": race["points"],
            "Status": race["status"],
            "DNF": race["status"].apply(is_dnf),
        }
    )


def load_qualifying_results(ergast, race_round):
    response = ergast.get_qualifying_results(season=YEAR, round=race_round)
    qualifying = response.content[0].copy()

    q1_seconds = timedelta_to_seconds(qualifying["Q1"])
    q2_seconds = timedelta_to_seconds(qualifying["Q2"])
    q3_seconds = timedelta_to_seconds(qualifying["Q3"])
    best_quali = pd.concat([q1_seconds, q2_seconds, q3_seconds], axis=1).min(axis=1)

    pole_time = best_quali.loc[qualifying["position"] == 1].min()

    return pd.DataFrame(
        {
            "Abbreviation": qualifying["driverCode"],
            "QualiPosition": qualifying["position"],
            "Q1Seconds": q1_seconds,
            "Q2Seconds": q2_seconds,
            "Q3Seconds": q3_seconds,
            "BestQualiLapSeconds": best_quali,
            "QualiDeltaToPole": best_quali - pole_time,
        }
    )


def load_practice_session(year, race_name, session_name):
    session = fastf1.get_session(year, race_name, session_name)
    session.load()

    laps = session.laps
    best_laps = laps.groupby("Driver")["LapTime"].min().reset_index()
    best_laps.rename(
        columns={
            "Driver": "Abbreviation",
            "LapTime": f"{session_name}Lap",
        },
        inplace=True,
    )
    best_laps[f"{session_name}LapSeconds"] = best_laps[
        f"{session_name}Lap"
    ].dt.total_seconds()

    return best_laps[["Abbreviation", f"{session_name}LapSeconds"]]


def load_practice_features(year, race_name):
    practice_frames = []

    for session_name in PRACTICE_SESSIONS:
        try:
            practice_frames.append(load_practice_session(year, race_name, session_name))
        except Exception as exc:
            print(f"Skipped {year} {race_name} {session_name}: {exc}")

    if not practice_frames:
        return pd.DataFrame(columns=["Abbreviation"])

    practice = practice_frames[0]
    for frame in practice_frames[1:]:
        practice = pd.merge(practice, frame, on="Abbreviation", how="outer")

    lap_columns = [
        f"{session_name}LapSeconds"
        for session_name in PRACTICE_SESSIONS
        if f"{session_name}LapSeconds" in practice.columns
    ]
    practice["BestPracticeLapSeconds"] = practice[lap_columns].min(axis=1)
    practice["PracticeDeltaToFastest"] = (
        practice["BestPracticeLapSeconds"] - practice["BestPracticeLapSeconds"].min()
    )
    practice["PracticePosition"] = practice["BestPracticeLapSeconds"].rank(
        method="min"
    )
    practice["PracticePaceMissing"] = practice["BestPracticeLapSeconds"].isna()

    return practice


def build_race_dataset(ergast, race):
    race_round = int(race["round"])
    race_name = race["raceName"]
    track = race["circuitName"]

    race_results = load_race_results(ergast, race_round)
    qualifying = load_qualifying_results(ergast, race_round)
    practice = load_practice_features(YEAR, race_name)

    dataset = pd.merge(race_results, qualifying, on="Abbreviation", how="left")
    dataset = pd.merge(dataset, practice, on="Abbreviation", how="left")
    dataset["PracticePaceMissing"] = dataset["BestPracticeLapSeconds"].isna()

    dataset["Year"] = YEAR
    dataset["Round"] = race_round
    dataset["RaceName"] = race_name
    dataset["Track"] = track

    columns = [
        "Year",
        "Round",
        "RaceName",
        "Track",
        "Driver",
        "Abbreviation",
        "Constructor",
        "GridPosition",
        "QualiPosition",
        "Q1Seconds",
        "Q2Seconds",
        "Q3Seconds",
        "BestQualiLapSeconds",
        "QualiDeltaToPole",
        "FP1LapSeconds",
        "FP2LapSeconds",
        "FP3LapSeconds",
        "BestPracticeLapSeconds",
        "PracticeDeltaToFastest",
        "PracticePosition",
        "PracticePaceMissing",
        "FinalPosition",
        "Points",
        "Status",
        "DNF",
    ]

    for column in columns:
        if column not in dataset.columns:
            dataset[column] = pd.NA

    return dataset[columns]


def save_incrementally(frames):
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    pd.concat(frames, ignore_index=True).to_csv(OUTPUT_PATH, index=False)


def main():
    fastf1.Cache.enable_cache(str(CACHE_DIR))
    ergast = Ergast(result_type="pandas", auto_cast=True, limit=1000)

    schedule = ergast.get_race_schedule(season=YEAR)
    all_data = []

    for _, race in schedule.iterrows():
        try:
            race_dataset = build_race_dataset(ergast, race)
            all_data.append(race_dataset)
            save_incrementally(all_data)
            print(f"Loaded {YEAR} round {race['round']} - {race['raceName']}")
        except Exception as exc:
            print(f"Skipped {YEAR} round {race['round']} - {race['raceName']}: {exc}")

    if not all_data:
        raise RuntimeError("No 2025 race data was loaded.")

    save_incrementally(all_data)
    final_df = pd.concat(all_data, ignore_index=True)
    print(f"Done! Saved {OUTPUT_PATH}")
    print(f"Rows: {len(final_df)}")
    print(f"Races: {final_df['RaceName'].nunique()}")


if __name__ == "__main__":
    main()
