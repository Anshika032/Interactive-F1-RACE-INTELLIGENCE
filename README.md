# 🏎️ Pitwall — Interactive F1 Race Intelligence

> AI-powered Formula 1 race prediction platform. Predicts finishing positions for all 20 drivers per Grand Prix using XGBoost trained on 5 seasons of real F1 data.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.0-orange)](https://xgboost.readthedocs.io)
[![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)](https://python.org)

---

## Overview

Pitwall is a full-stack motorsport intelligence platform that combines machine learning with real-time F1 data. It ingests FastF1 telemetry, computes composite driver strength features, and serves predictions via a FastAPI backend to a Next.js frontend with 3D visualization.

**Core capabilities:**
- Per-driver finishing position prediction for all 20 drivers before each race
- Live qualifying gap ingestion, driver form rolling averages, track history, and weather integration
- Post-race postmortem with predicted vs actual comparison and MAE breakdown
- Animated Monaco circuit map (12,346-polyline real SVG) with S1/S2/S3 sector coloring
- 3D hero car with multi-team livery rotation via Three.js material overrides
- Live OpenMeteo weather feed with wet race strategy alert

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, Framer Motion |
| 3D Rendering | React Three Fiber, Drei, @react-three/postprocessing (Bloom) |
| Backend | FastAPI, Uvicorn, Python 3.10+ |
| ML Model | XGBoost Regressor, scikit-learn, joblib |
| Data Pipeline | FastF1, pandas, numpy |
| Weather | OpenMeteo REST API |
| Version Control | Git, GitHub |

---

## Model

| Metric | Value |
|--------|-------|
| Algorithm | XGBoost Regressor |
| Training data | 2022–2026 seasons |
| Rows | 2,427 |
| Cross-val MAE | 3.61 positions |
| Ex-DNF MAE | 3.1 positions |

### Feature Engineering

| Feature | Description | Importance |
|---------|-------------|------------|
| `QualiGapFromPole_s` | Qualifying time delta from pole position | 12.7% |
| `UltimateLap_s` | Theoretical best lap from sector bests | High |
| `DriverStrength` | Composite: DriverForm 40% + TrackHistory 30% + ChampionshipPoints 30% | High |
| `SprintGapPerLap` | Sprint race pace normalized per lap | Medium |
| `WeatherRainProb` | Live rain probability from OpenMeteo | Medium |
| Reliability features | DNF history, mechanical failure rates | Medium |

### Grid Position Bias Correction
Post-prediction correction applied in `backend/app/main.py` (~line 661) to offset systematic underestimation of front-row starters.

### Custom Encoder
Model uses `AliasAwareLabelEncoder` to handle driver name variants (accents, aliases). Registered at load time — see `encoder_compat.py`.

> ⚠️ Model `.pkl` files are excluded from git. Retrain locally before running the backend.

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+

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

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

---

## Retrain the Model

```bash
python src/training/retrain_2025.py
```

- Input: `data/full_multiseason_dataset_2025.csv`
- Output: `models/xgboost_multiseason_reliability.pkl`, `models/multiseason_reliability_encoders.pkl`

### Loading the Model Manually

```python
import sys, types, joblib
sys.path.insert(0, '.')
import encoder_compat
m = types.ModuleType('LabelEncoder')
m.AliasAwareLabelEncoder = encoder_compat.AliasAwareLabelEncoder
sys.modules['LabelEncoder'] = m

model = joblib.load('models/xgboost_multiseason_reliability.pkl')
encoders = joblib.load('models/multiseason_reliability_encoders.pkl')
```

**Critical encoder strings** — must match exactly:
- `"Sergio Pérez"` (accent required)
- `"Nico Hülkenberg"` (umlaut required)
- `"Alpine F1 Team"`, `"Haas F1 Team"` (exact spacing)

---

## Project Structure

```
├── backend/
│   └── app/
│       └── main.py                   # FastAPI server + bias correction (~line 661)
├── frontend/
│   ├── components/
│   │   ├── HeroSection.tsx           # GSAP animated hero
│   │   ├── F1CarScene.tsx            # Three.js 3D car, multi-team livery rotation
│   │   ├── RaceInfo.tsx              # Circuit SVG map + countdown + live weather
│   │   ├── PredictionDashboard.tsx   # Prediction UI + postmortem table
│   │   ├── PodiumScene.tsx           # 3D podium visualization
│   │   └── LiveBackground.tsx        # Particle background
│   ├── src/
│   │   └── data/
│   │       └── monaco-sectors.ts     # ⚠️ Generated — see Circuit Map section
│   └── app/
│       └── predict/page.tsx          # /predict route
├── src/
│   └── training/
│       └── retrain_2025.py           # Model retrain entrypoint
├── encoder_compat.py                 # AliasAwareLabelEncoder definition
├── residual_analysis.py              # Grid bucket residual diagnostics
└── models/                           # ⚠️ Not in git — retrain locally
```

---

## Circuit Map

The Monaco circuit SVG (`RaceInfo.tsx`) uses real Iconscout geometry — 12,346 polylines processed into 3 sector path groups and committed as `frontend/src/data/monaco-sectors.ts`.

Sector coloring is spatial-zone-based (not lap-distance-based), so sector boundaries are approximate. The animated dot follows GPS-derived waypoints mapped to SVG coordinate space.

To regenerate after updating the source SVG:
```bash
# Re-run the Python generation script, then force-add (file is gitignored by default)
git add -f frontend/src/data/monaco-sectors.ts
```

---

## 2026 Season Tracker

| Round | Race | Prediction Status |
|-------|------|-------------------|
| 1 | Australian GP | ✅ Complete |
| 2 | Chinese GP | ✅ Complete |
| 3 | Japanese GP | ✅ Complete |
| 4 | Miami GP | ✅ Complete |
| 5 | Canadian GP | ✅ Complete — postmortem built |
| 6 | Monaco GP | ✅ Complete — June 7 |
| 7 | Barcelona GP | ⏳ June 14 |

---

## Canada 2026 Postmortem

| Driver | Grid | Predicted | Actual | Error |
|--------|------|-----------|--------|-------|
| Kimi Antonelli | P2 | P5.5 | P1 | 4.5 |
| Lewis Hamilton | P5 | P5.0 | P2 | 3.0 |
| Max Verstappen | P3 | P3.2 | P3 | ✅ 0.2 |
| Charles Leclerc | P4 | P6.1 | P4 | 2.1 |
| George Russell | P1 | P2.1 | DNF | — |

**Race MAE:** 4.76 &nbsp;|&nbsp; **Ex-DNF MAE:** 3.1

Primary error source: no circuit-specific car pace signal — Antonelli's Mercedes pace advantage at Canada was invisible to the model.

---

## Known Limitations

- No circuit-specific constructor pace signal (dominant source of prediction error at tracks with aero-sensitive layouts)
- Win/podium probabilities are estimated from predicted finishing position, not from a separate classification model
- `DRIVER_PROFILES` grid positions in `PredictionDashboard.tsx` are hardcoded — must be updated manually after qualifying
- Sector coloring on circuit map is approximate (spatial zones, not lap-distance splits)

---

## Roadmap

- [ ] `DriverStrength` composite feature integration into live predictions
- [ ] `colsample_bytree=0.6` rebalance to reduce `QualiPosition` dominance
- [ ] Live weather feature injection at prediction time via OpenMeteo
- [ ] Telemetry charts on prediction dashboard
- [ ] Barcelona GP prediction

---

## License

MIT
