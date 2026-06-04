# 🏎️ Interactive F1 Race Intelligence

> AI-powered Formula 1 race prediction platform — predicts finishing positions for all 20 drivers using machine learning trained on 2022–2026 race data.

---

## What It Does

- Predicts race finishing positions for all 20 F1 drivers before each Grand Prix
- Uses qualifying gap from pole, driver form, championship standings, track history, and live weather
- Shows postmortem analysis comparing predictions vs actual results after each race
- Displays live Monaco countdown, animated circuit map, and OpenMeteo weather data

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | Next.js 16, Tailwind CSS, Framer Motion, Three.js |
| Backend | FastAPI, FastF1, Python |
| Model | XGBoost (retrained on 2022–2026, 2427 rows, 5 seasons) |
| Weather | OpenMeteo API (live rain probability) |

---

## Model Details

- **Algorithm:** XGBoost regressor
- **CV MAE:** 3.61 (3.1 excluding DNFs)
- **Training data:** 2022–2026 seasons (2427 rows)
- **Top features:**
  - `QualiGapFromPole_s` — qualifying time gap from pole (12.7% importance)
  - `UltimateLap_s` — theoretical best lap
  - `DriverStrength` — composite of DriverForm (40%), TrackHistory (30%), ChampionshipPoints (30%)
  - `SprintGapPerLap`, `WeatherRainProb`, reliability features

**Note:** Model `.pkl` files are not included in this repo. You must retrain locally.

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- pip, npm

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`  
Backend runs at `http://localhost:8000`

---

## Retrain the Model

```bash
cd D:\f1-race-intelligence
python src/training/retrain_2025.py
```

- Training data expected at: `data/full_multiseason_dataset_2025.csv`
- Outputs saved to: `models/xgboost_multiseason_reliability.pkl` and `models/multiseason_reliability_encoders.pkl`
- Both `.pkl` files and `data/` are excluded from git (see `.gitignore`)

### Loading the model outside the retrain script

The model uses a custom `AliasAwareLabelEncoder`. To load it elsewhere:

```python
import sys, types
sys.path.insert(0, '.')
import encoder_compat
m = types.ModuleType('LabelEncoder')
m.AliasAwareLabelEncoder = encoder_compat.AliasAwareLabelEncoder
sys.modules['LabelEncoder'] = m
import joblib
model = joblib.load('models/xgboost_multiseason_reliability.pkl')
encoders = joblib.load('models/multiseason_reliability_encoders.pkl')
```

---

## Project Structure

```
├── backend/
│   └── app/
│       └── main.py              # FastAPI backend, bias correction at ~line 661
├── frontend/
│   ├── components/
│   │   ├── PredictionDashboard.tsx   # Main prediction UI + Canada postmortem
│   │   ├── RaceInfo.tsx              # Monaco countdown + live weather
│   │   └── HeroSection.tsx
│   └── app/
│       └── predict/page.tsx          # /predict route
├── src/
│   └── training/
│       └── retrain_2025.py           # Model retrain script
├── encoder_compat.py                 # Custom encoder for model loading
├── residual_analysis.py              # Grid bucket residual diagnosis
└── models/                          # ⚠️ Not in git — retrain locally
```

---

## 2026 Season Status

| Round | Race | Status |
|-------|------|--------|
| 1 | Australian GP | ✅ Done |
| 2 | Chinese GP | ✅ Done |
| 3 | Japanese GP | ✅ Done |
| 4 | Miami GP | ✅ Done |
| 5 | Canadian GP | ✅ Done — postmortem built |
| 6 | Monaco GP | ⏳ June 7 |
| 7 | Barcelona GP | June 14 |

---

## Canada 2026 Postmortem

| Driver | Grid | Predicted | Actual | Error |
|--------|------|-----------|--------|-------|
| Kimi Antonelli | P2 | P5.5 | P1 | 4.5 |
| Lewis Hamilton | P5 | P5.0 | P2 | 3.0 |
| Max Verstappen | P3 | P3.2 | P3 | ✅ 0.2 |
| Charles Leclerc | P4 | P6.1 | P4 | 2.1 |
| George Russell | P1 | P2.1 | DNF | — |

**Overall MAE:** 4.76 &nbsp;|&nbsp; **Ex-DNF MAE:** 3.1

---

## Known Limitations

- No signal for car pace dominance at a specific circuit (main driver of Antonelli Canada error)
- Confidence scores are heuristic-based, not model-derived
- Win/podium probabilities derived from predicted position, not an independent probability model
- `DRIVER_PROFILES` grid positions in `PredictionDashboard.tsx` are hardcoded and must be updated manually after qualifying

---

## License

MIT