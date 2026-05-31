import fastf1
import pandas as pd

fastf1.Cache.enable_cache('cache')

all_data = []
output_path = 'data/historical_f1_dataset.csv'

years = [2025]

for year in years:
    schedule = fastf1.get_event_schedule(year)

    for _, race in schedule.iterrows():
        try:
            race_name = race['EventName']

            # Race session
            race_session = fastf1.get_session(year, race_name, 'R')
            race_session.load()

            race_results = race_session.results[
                ['FullName', 'Position']
            ].copy()

            # Qualifying session
            quali_session = fastf1.get_session(year, race_name, 'Q')
            quali_session.load()

            quali_results = quali_session.results[
                ['FullName', 'Position']
            ].copy()

            quali_results.rename(
                columns={'Position': 'QualiPosition'},
                inplace=True
            )

            merged = pd.merge(
                race_results,
                quali_results,
                on='FullName'
            )

            merged['Year'] = year
            merged['RaceName'] = race_name

            all_data.append(merged)
            pd.concat(all_data).to_csv(output_path, index=False)

            print(f"Loaded {year} - {race_name}")

        except Exception as e:
            print(f"Skipped {year} - {race_name}: {e}")

final_df = pd.concat(all_data)
final_df.to_csv(output_path, index=False)

print("Done!")
