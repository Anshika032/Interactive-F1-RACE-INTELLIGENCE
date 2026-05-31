"""
retrain_2025.py  —  RACE ORACLE  (fixed build, May 2026)
---------------------------------------------------------
Fixes applied:
  - QualiTime_s now stored in race rows so QualiGapFromPole_s is real seconds
  - UltimateLap_s (best S1+S2+S3) added as feature
  - DriverStrength composite feature added
  - XGBoost params rebalanced (colsample_bytree=0.6, max_depth=5)
  - Canada 2026 ingestion supported via EXTRA_RACES list
  - SprintGapPerLap added (0.0 for non-sprint weekends)
"""

import os
import sys
import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
import joblib
import fastf1
from xgboost import XGBRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import cross_val_score
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT         = Path(__file__).resolve().parents[2]
DATA_DIR     = ROOT / "data"
MODELS_DIR   = ROOT / "models"
CACHE_DIR    = ROOT / "backend" / "cache"

EXISTING_CSV  = DATA_DIR / "full_multiseason_dataset_reliability.csv"
DATASET_2025  = DATA_DIR / "dataset_2025.csv"
COMBINED_CSV  = DATA_DIR / "full_multiseason_dataset_2025.csv"
MODEL_OUT     = MODELS_DIR / "xgboost_multiseason_reliability.pkl"
ENCODERS_OUT  = MODELS_DIR / "multiseason_reliability_encoders.pkl"

fastf1.Cache.enable_cache(str(CACHE_DIR))

# ── Add 2026 races here as they complete ──────────────────────────────────────
# Format: (year, round_number)
EXTRA_RACES = [
    (2026, 1),   # Australian Grand Prix
    (2026, 2),   # Chinese Grand Prix
    (2026, 3),   # Japanese Grand Prix
    (2026, 4),   # Miami Grand Prix
    (2026, 5),   # Canadian Grand Prix
]

POINTS_MAP = {1:25, 2:18, 3:15, 4:12, 5:10, 6:8, 7:6, 8:4, 9:2, 10:1}

DNF_STATUSES = {
    'Retired','Accident','Engine','Gearbox','Hydraulics',
    'Collision','Mechanical','Power Unit','Brakes',
    'Suspension','Electrical','Withdrew','Disqualified',
    'Collision damage','Safety concerns'
}

CIRCUIT_RAIN_PROB = {
    "Bahrain Grand Prix":           0.05,
    "Saudi Arabian Grand Prix":     0.03,
    "Australian Grand Prix":        0.20,
    "Japanese Grand Prix":          0.30,
    "Chinese Grand Prix":           0.25,
    "Miami Grand Prix":             0.30,
    "Emilia Romagna Grand Prix":    0.25,
    "Monaco Grand Prix":            0.30,
    "Canadian Grand Prix":          0.35,
    "Barcelona Grand Prix":         0.15,
    "Spanish Grand Prix":           0.15,
    "Austrian Grand Prix":          0.35,
    "British Grand Prix":           0.45,
    "Hungarian Grand Prix":         0.30,
    "Belgian Grand Prix":           0.55,
    "Dutch Grand Prix":             0.40,
    "Italian Grand Prix":           0.20,
    "Azerbaijan Grand Prix":        0.10,
    "Singapore Grand Prix":         0.40,
    "United States Grand Prix":     0.25,
    "Mexico City Grand Prix":       0.20,
    "São Paulo Grand Prix":         0.45,
    "Las Vegas Grand Prix":         0.05,
    "Qatar Grand Prix":             0.05,
    "Abu Dhabi Grand Prix":         0.05,
}

# Sprint weekends — needed to skip sprint fetch for non-sprint rounds
SPRINT_ROUNDS_2025 = {2, 6, 12, 17, 21}   # China, Miami, Belgium, CUSA, Brazil
SPRINT_ROUNDS_2026 = {2, 4}  # China, Miami only

NAME_NORMALIZE = {
    'Kimi Antonelli':         'Andrea Kimi Antonelli',
    'Nico Hulkenberg':        'Nico Hülkenberg',
    'Sergio Perez':           'Sergio Pérez',
    'Franco Colapinto':       'Franco Colapinto',
    'Arvid Lindblad':         'Arvid Lindblad',
}


def safe_seconds(td):
    try:
        return td.total_seconds()
    except Exception:
        return None


def fetch_quali_data(session):
    """
    Returns dict keyed by FullName:
      QualiPosition, QualiTime_s, QualiDeltaToPole, UltimateLap_s
    UltimateLap_s = best S1 + best S2 + best S3 (pure car pace).
    """
    quali_data = {}
    pole_time_s = None

    try:
        q_results = session.results
        laps = session.laps

        # Find pole time first
        for _, qrow in q_results.iterrows():
            abbr = str(qrow.get('Abbreviation', ''))
            drv_laps = laps.pick_drivers(abbr)
            best = drv_laps['LapTime'].min()
            if pd.notna(best):
                pole_time_s = safe_seconds(best)
                break

        for _, qrow in q_results.iterrows():
            abbr      = str(qrow.get('Abbreviation', ''))
            full_name = str(qrow.get('FullName', ''))
            full_name = NAME_NORMALIZE.get(full_name, full_name)
            drv_laps  = laps.pick_drivers(abbr)
            best      = drv_laps['LapTime'].min()

            quali_time_s = safe_seconds(best) if pd.notna(best) else None
            delta = 0.0
            if quali_time_s and pole_time_s:
                delta = max(0.0, round(quali_time_s - pole_time_s, 3))

            # UltimateLap: best sector times summed
            ultimate_lap = np.nan
            try:
                s1 = drv_laps['Sector1Time'].dropna().min()
                s2 = drv_laps['Sector2Time'].dropna().min()
                s3 = drv_laps['Sector3Time'].dropna().min()
                if pd.notna(s1) and pd.notna(s2) and pd.notna(s3):
                    ultimate_lap = round(
                        safe_seconds(s1) + safe_seconds(s2) + safe_seconds(s3), 3
                    )
            except Exception:
                pass

            quali_data[full_name] = {
                'QualiTime_s':       round(quali_time_s, 3) if quali_time_s else np.nan,
                'QualiPosition':     int(qrow['Position']) if pd.notna(qrow.get('Position')) else 20,
                'QualiDeltaToPole':  delta,
                'UltimateLap_s':     ultimate_lap,
            }
    except Exception as e:
        print(f"  [WARN] Quali parse error: {e}")

    return quali_data, pole_time_s


def fetch_sprint_gap(session, race_name, year, round_num):
    """
    Returns dict keyed by FullName: SprintGapPerLap_s
    Returns empty dict if sprint not available.
    """
    sprint_rounds = SPRINT_ROUNDS_2026 if year == 2026 else SPRINT_ROUNDS_2025
    if round_num not in sprint_rounds:
        return {}

    try:
        sprint = fastf1.get_session(year, round_num, 'Sprint')
        sprint.load(telemetry=False, weather=False, messages=False)
        s_results = sprint.results
        if s_results is None or s_results.empty:
            return {}

        laps_completed = s_results['NumberOfLaps'].max()
        if not laps_completed or laps_completed == 0:
            laps_completed = 17  # fallback

        leader_time = None
        sprint_gaps = {}

        for _, srow in s_results.iterrows():
            full_name = str(srow.get('FullName', ''))
            full_name = NAME_NORMALIZE.get(full_name, full_name)
            time_val  = srow.get('Time', None)
            if leader_time is None and pd.notna(time_val):
                leader_time = safe_seconds(time_val)
                sprint_gaps[full_name] = 0.0
            elif pd.notna(time_val) and leader_time:
                gap = max(0.0, safe_seconds(time_val) - leader_time)
                sprint_gaps[full_name] = round(gap / max(1, laps_completed), 4)
            else:
                sprint_gaps[full_name] = 2.0  # DNF penalty

        return sprint_gaps
    except Exception as e:
        print(f"  [INFO] Sprint not available ({e})")
        return {}


def fetch_season_data(year):
    """Fetch all completed races for a given season year."""
    print(f"\n=== Fetching {year} F1 Season Data ===")

    if year == 2026:
        # For 2026, use EXTRA_RACES list
        rounds_to_fetch = [(y, r) for y, r in EXTRA_RACES if y == year]
    else:
        schedule = fastf1.get_event_schedule(year, include_testing=False)
        completed = schedule[schedule['RoundNumber'] > 0]
        rounds_to_fetch = [(year, int(r)) for r in completed['RoundNumber']]

    all_rows = []
    championship_points = {}

    for fetch_year, round_num in rounds_to_fetch:
        try:
            event = fastf1.get_event(fetch_year, round_num)
            race_name = event['EventName']
        except Exception:
            race_name = f"Round {round_num}"

        print(f"\n[{fetch_year} Round {round_num}] {race_name}")

        # ── Load Race ──────────────────────────────────────────────────────
        try:
            race = fastf1.get_session(fetch_year, round_num, 'R')
            race.load(telemetry=False, weather=True, messages=False)
        except Exception as e:
            print(f"  [SKIP] Race load failed: {e}")
            continue

        race_results = race.results
        if race_results is None or race_results.empty:
            print(f"  [SKIP] No race results")
            continue
        if race_results['Position'].isna().all():
            print(f"  [SKIP] Race not completed yet")
            continue

        # ── Weather ────────────────────────────────────────────────────────
        rain_prob = CIRCUIT_RAIN_PROB.get(race_name, 0.2)
        try:
            weather = race.weather_data
            if weather is not None and not weather.empty and 'Rainfall' in weather.columns:
                rain_laps  = weather['Rainfall'].sum()
                total_laps = len(weather)
                rain_prob  = round(rain_laps / max(1, total_laps), 3)
        except Exception:
            pass

        # ── Qualifying ─────────────────────────────────────────────────────
        quali_data = {}
        try:
            quali = fastf1.get_session(fetch_year, round_num, 'Q')
            quali.load(telemetry=False, weather=False, messages=False)
            quali_data, _ = fetch_quali_data(quali)
        except Exception as e:
            print(f"  [WARN] Quali load failed: {e}")

        # ── Practice ───────────────────────────────────────────────────────
        practice_data = {}
        try:
            fp2 = fastf1.get_session(fetch_year, round_num, 'FP2')
            fp2.load(telemetry=False, weather=False, messages=False)
            fp2_laps = fp2.laps
            fastest_practice = fp2_laps['LapTime'].min()

            for abbr in fp2_laps['Driver'].unique():
                drv_laps = fp2_laps.pick_drivers(abbr)
                best     = drv_laps['LapTime'].min()
                pos_mask = fp2.results['Abbreviation'] == abbr
                fname    = fp2.results[pos_mask]['FullName'].values
                if len(fname) == 0:
                    continue
                fname    = str(fname[0])
                fname    = NAME_NORMALIZE.get(fname, fname)
                best_sec = safe_seconds(best) if pd.notna(best) else None
                delta    = 0.0
                if best_sec and pd.notna(fastest_practice):
                    delta = max(0.0, best_sec - safe_seconds(fastest_practice))
                practice_data[fname] = {
                    'BestPracticeLapSeconds': round(best_sec, 3) if best_sec else 90.0,
                    'PracticeDeltaToFastest': round(delta, 3),
                }
        except Exception as e:
            print(f"  [WARN] Practice load failed: {e}")

        # ── Sprint ─────────────────────────────────────────────────────────
        sprint_gaps = fetch_sprint_gap(race, race_name, fetch_year, round_num)

        # ── Snapshot champ points BEFORE this race ─────────────────────────
        champ_snapshot = dict(championship_points)

        # ── Build rows ─────────────────────────────────────────────────────
        race_rows = []
        for _, row in race_results.iterrows():
            full_name   = str(row.get('FullName', ''))
            # Normalize driver names across seasons
            full_name   = NAME_NORMALIZE.get(full_name, full_name)
            team        = str(row.get('TeamName', 'Unknown'))
            grid        = int(row['GridPos']) if pd.notna(row.get('GridPos')) else 20
            final_pos   = row.get('Position', None)
            status      = str(row.get('Status', ''))
            points_earn = float(row.get('Points', 0)) if pd.notna(row.get('Points')) else 0.0

            if not pd.notna(final_pos):
                continue
            final_pos = int(final_pos)
            dnf = 1 if status in DNF_STATUSES else 0

            q_info = quali_data.get(full_name, {})
            p_info = practice_data.get(full_name, {})
            champ_pts = champ_snapshot.get(full_name, 0)

            # QualiGapFromPole — real seconds, not ordinal
            quali_time_s = q_info.get('QualiTime_s', np.nan)
            quali_delta  = q_info.get('QualiDeltaToPole', 1.0)

            race_rows.append({
                'Season':                  fetch_year,
                'Round':                   round_num,
                'RaceName':                race_name,
                'Driver':                  full_name,
                'Constructor':             team,
                'GridPosition':            grid,
                'QualiPosition':           q_info.get('QualiPosition', grid),
                'QualiTime_s':             quali_time_s,          # ← NEW: stored now
                'QualiDeltaToPole':        quali_delta,
                'UltimateLap_s':           q_info.get('UltimateLap_s', np.nan),  # ← NEW
                'SprintGapPerLap':         sprint_gaps.get(full_name, 0.0),       # ← NEW
                'BestPracticeLapSeconds':  p_info.get('BestPracticeLapSeconds', 90.0),
                'PracticePosition':        grid,
                'PracticeDeltaToFastest':  p_info.get('PracticeDeltaToFastest', 0.5),
                'FinalPosition':           final_pos,
                'Points':                  points_earn,
                'Status':                  status,
                'DNF':                     dnf,
                'ChampionshipPoints':      champ_pts,
                'WeatherRainProb':         rain_prob,
            })

            championship_points[full_name] = champ_snapshot.get(full_name, 0) + points_earn

        print(f"  [OK] {len(race_rows)} driver rows")
        all_rows.extend(race_rows)

    if not all_rows:
        print(f"[ERROR] No {year} data collected")
        return pd.DataFrame()

    df = pd.DataFrame(all_rows)
    print(f"\n[DONE] {year} dataset: {df.shape[0]} rows, {df['Round'].nunique()} races")
    return df


def compute_rolling_features(df):
    print("\n=== Computing Rolling Features ===")
    df = df.sort_values(['Season', 'Round']).reset_index(drop=True)

    driver_form_list      = []
    constructor_form_list = []
    track_history_list    = []
    gain_potential_list   = []
    driver_dnf_list       = []
    constructor_dnf_list  = []
    reliability_list      = []

    for idx, row in df.iterrows():
        season = row['Season']
        rnd    = row['Round']
        driver = row['Driver']
        team   = row['Constructor']
        track  = row['RaceName']

        past = df[
            (df['Driver'] == driver) &
            (df['Season'] == season) &
            (df['Round'] < rnd)
        ]
        recent = past.tail(5)
        d_form = round(max(0.1, min(1.0, 1 - (recent['FinalPosition'].mean() - 1) / 19)), 3) \
                 if len(recent) > 0 else 0.5
        driver_form_list.append(d_form)

        past_team = df[
            (df['Constructor'] == team) &
            (df['Season'] == season) &
            (df['Round'] < rnd)
        ].tail(10)
        c_form = round(max(0.1, min(1.0, 1 - (past_team['FinalPosition'].mean() - 1) / 19)), 3) \
                 if len(past_team) > 0 else 0.5
        constructor_form_list.append(c_form)

        past_track = df[
            (df['Driver'] == driver) &
            (df['RaceName'] == track) &
            ((df['Season'] < season) | ((df['Season'] == season) & (df['Round'] < rnd)))
        ]
        t_hist = round(max(0.1, min(1.0, 1 - (past_track['FinalPosition'].mean() - 1) / 19)), 3) \
                 if len(past_track) > 0 else 0.5
        track_history_list.append(t_hist)

        grid = row['GridPosition']
        gain_potential_list.append(round(grid - d_form * 10, 2))

        past10 = past.tail(10)
        d_dnf  = round(past10['DNF'].mean(), 3) if len(past10) > 0 else 0.05
        driver_dnf_list.append(d_dnf)

        c_dnf_val = df[
            (df['Constructor'] == team) &
            (df['Season'] == season) &
            (df['Round'] < rnd)
        ].tail(20)['DNF'].mean()
        c_dnf = round(c_dnf_val, 3) if pd.notna(c_dnf_val) else 0.04
        constructor_dnf_list.append(c_dnf)

        reliability_list.append(round(1 - (d_dnf + c_dnf) / 2, 3))

    df['DriverForm']         = driver_form_list
    df['ConstructorForm']    = constructor_form_list
    df['TrackHistory']       = track_history_list
    df['GainPotential']      = gain_potential_list
    df['DriverDNFRate']      = driver_dnf_list
    df['ConstructorDNFRate'] = constructor_dnf_list
    df['ReliabilityScore']   = reliability_list
    return df


def add_derived_features(df):
    """Add QualiGapFromPole_s and DriverStrength after rolling features exist."""

    # QualiGapFromPole_s — real seconds gap from pole
    if 'QualiTime_s' in df.columns:
        year_col = 'Season' if 'Season' in df.columns else 'Year'
        pole_times = df.groupby([year_col, 'Round'])['QualiTime_s'].transform('min')
        df['QualiGapFromPole_s'] = (df['QualiTime_s'] - pole_times).clip(lower=0)
    if 'QualiGapFromPole_s' not in df.columns:
        df['QualiGapFromPole_s'] = df.get('QualiDeltaToPole', pd.Series(1.0, index=df.index))
    # Fill remaining NaN with QualiDeltaToPole fallback
    df['QualiGapFromPole_s'] = df['QualiGapFromPole_s'].fillna(
        df.get('QualiDeltaToPole', 1.0)
    )

    # DriverStrength composite — reduces dependence on any single feature
    champ_max = df['ChampionshipPoints'].clip(lower=1).max()
    df['DriverStrength'] = (
        df['DriverForm']          * 0.4 +
        df['TrackHistory']        * 0.3 +
        (df['ChampionshipPoints'] / champ_max) * 0.3
    ).round(4)

    # UltimateLap_s — fill missing with QualiTime_s fallback
    if 'UltimateLap_s' not in df.columns:
        df['UltimateLap_s'] = np.nan
    df['UltimateLap_s'] = df['UltimateLap_s'].fillna(df.get('QualiTime_s', np.nan))

    # SprintGapPerLap — fill missing with 0
    if 'SprintGapPerLap' not in df.columns:
        df['SprintGapPerLap'] = 0.0
    df['SprintGapPerLap'] = df['SprintGapPerLap'].fillna(0.0)

    return df


def retrain(combined_df):
    print("\n=== Retraining XGBoost ===")

    combined_df = add_derived_features(combined_df)

    driver_enc      = LabelEncoder()
    constructor_enc = LabelEncoder()
    track_enc       = LabelEncoder()

    combined_df['DriverEncoded']      = driver_enc.fit_transform(combined_df['Driver'])
    combined_df['ConstructorEncoded'] = constructor_enc.fit_transform(combined_df['Constructor'])
    combined_df['TrackEncoded']       = track_enc.fit_transform(combined_df['RaceName'])

    for col in ['ChampionshipPoints', 'WeatherRainProb']:
        if col not in combined_df.columns:
            combined_df[col] = 0.0
    combined_df['ChampionshipPoints'] = combined_df['ChampionshipPoints'].fillna(0.0)
    combined_df['WeatherRainProb']    = combined_df['WeatherRainProb'].fillna(0.2)

    FEATURES = [
        # Pace signals — real seconds, not ordinals
        'QualiGapFromPole_s',       # gap from pole in seconds (was QualiPosition 39.8%!)
        'UltimateLap_s',            # best S1+S2+S3 — pure car pace
        'QualiDeltaToPole',         # keep as backup signal
        'SprintGapPerLap',          # sprint race pace per lap

        # Grid & practice
        'GridPosition',
        'Round',
        'BestPracticeLapSeconds',
        'PracticePosition',
        'PracticeDeltaToFastest',

        # Form & strength
        'DriverStrength',           # composite: form + track history + champ pts
        'DriverForm',
        'ConstructorForm',
        'TrackHistory',
        'GainPotential',

        # Reliability
        'DriverDNFRate',
        'ConstructorDNFRate',
        'ReliabilityScore',

        # Context
        'ChampionshipPoints',
        'WeatherRainProb',

        # Encoded categoricals
        'DriverEncoded',
        'ConstructorEncoded',
        'TrackEncoded',
    ]

    TARGET = 'FinalPosition'
    train_df = combined_df.dropna(subset=[TARGET]).copy()

    # Fill remaining NaN in features with medians
    for f in FEATURES:
        if f in train_df.columns:
            train_df[f] = train_df[f].fillna(train_df[f].median())
        else:
            train_df[f] = 0.0

    print(f"Training on {len(train_df)} rows, {train_df['Season'].nunique()} seasons")
    print(f"Seasons: {sorted(train_df['Season'].unique().tolist())}")

    X = train_df[FEATURES]
    y = train_df[TARGET]

    model = XGBRegressor(
        n_estimators=800,
        max_depth=5,            # reduced from 6
        learning_rate=0.04,
        subsample=0.8,
        colsample_bytree=0.6,   # reduced from 0.8 — forces feature diversity
        colsample_bylevel=0.6,  # added
        min_child_weight=5,     # increased from 3
        reg_alpha=0.5,          # increased regularization
        reg_lambda=2.0,
        random_state=42,
        n_jobs=-1,
        verbosity=0,
    )

    cv_scores = cross_val_score(model, X, y, cv=5, scoring='neg_mean_absolute_error')
    print(f"CV MAE: {-cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

    model.fit(X, y)

    joblib.dump(model, MODEL_OUT)
    joblib.dump({
        'driver_encoder':      driver_enc,
        'constructor_encoder': constructor_enc,
        'track_encoder':       track_enc,
        'feature_names':       FEATURES,
    }, ENCODERS_OUT)

    print(f"\n[SAVED] Model    → {MODEL_OUT}")
    print(f"[SAVED] Encoders → {ENCODERS_OUT}")
    print(f"\nFeature importances (top 12):")
    importances = pd.Series(model.feature_importances_, index=FEATURES)
    top = importances.sort_values(ascending=False).head(12)
    for feat, imp in top.items():
        bar = '█' * int(imp * 60)
        print(f"  {feat:<28} {imp:.4f}  {bar}")

    # Sanity check — Antonelli from pole should predict top 3
    print("\n=== Sanity Check ===")
    _run_sanity_check(model, combined_df, driver_enc, constructor_enc, track_enc, FEATURES)

    return model, FEATURES


def _run_sanity_check(model, df, driver_enc, constructor_enc, track_enc, FEATURES):
    """Score the actual Canadian 2026 rows from the training frame."""
    canada = df[(df['Season'] == 2026) & (df['RaceName'] == 'Canadian Grand Prix')].copy()
    if canada.empty:
        print("  [SKIP] No Canadian Grand Prix 2026 rows found")
        return

    if 'FinalPosition' in canada.columns:
        canada = canada.sort_values('FinalPosition').head(3)

    for _, row in canada.iterrows():
        try:
            X_check = pd.DataFrame([{f: row.get(f, 0.0) for f in FEATURES}])[FEATURES]
            pred = model.predict(X_check)[0]
            actual = row.get('FinalPosition', 'NA')
            driver = row.get('Driver', 'Unknown')
            status = '✅' if pred <= 3 else '⚠️ CHECK'
            print(f"  {status}  {driver:<30} Actual=P{actual}  → Predicted P{pred:.1f}")
        except Exception as e:
            print(f"  [SKIP] {row.get('Driver', 'Unknown')}: {e}")


def main():
    print(f"Loading existing dataset: {EXISTING_CSV}")
    df_old = pd.read_csv(EXISTING_CSV)
    print(f"  Existing: {df_old.shape[0]} rows, seasons: {sorted(df_old['Season'].unique().tolist())}")

    # Fetch 2025
    df_2025_raw = fetch_season_data(2025)

    # Fetch 2026 completed races
    df_2026_raw = fetch_season_data(2026)

    frames = [df_old]
    if not df_2025_raw.empty:
        frames.append(df_2025_raw)
    if not df_2026_raw.empty:
        frames.append(df_2026_raw)

    df_combined_raw = pd.concat(frames, ignore_index=True)
    df_combined_raw = df_combined_raw.sort_values(['Season', 'Round']).reset_index(drop=True)

    # Compute rolling features on full combined dataset
    df_combined = compute_rolling_features(df_combined_raw)

    # Save datasets
    if not df_2025_raw.empty:
        df_2025_out = df_combined[df_combined['Season'] == 2025].copy()
        df_2025_out.to_csv(DATASET_2025, index=False)
        print(f"\n[SAVED] 2025 dataset → {DATASET_2025}")

    df_combined.to_csv(COMBINED_CSV, index=False)
    print(f"[SAVED] Combined dataset → {COMBINED_CSV} ({df_combined.shape[0]} rows)")

    model, features = retrain(df_combined)

    print("\n=== DONE ===")
    print("Restart your backend to load the new model.")


if __name__ == "__main__":
    main()