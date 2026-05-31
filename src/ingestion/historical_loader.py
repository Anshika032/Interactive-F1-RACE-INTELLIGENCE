"""Deprecated FastF1-only historical loader.

Do not use this for broad historical ingestion. FastF1 is excellent for rich
session data, but historical race and qualifying results should come from the
Ergast/Jolpica path in ``hybrid_loader.py``.
"""

from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
BASELINE_DATASET = PROJECT_ROOT / "data" / "canada_2025_dataset.csv"
HYBRID_LOADER = PROJECT_ROOT / "src" / "ingestion" / "hybrid_loader.py"


if __name__ == "__main__":
    print("Stopped: FastF1-only historical ingestion is disabled.")
    print(f"Baseline dataset: {BASELINE_DATASET}")
    print(f"Use hybrid loader: {HYBRID_LOADER}")
    print("Example:")
    print("  .venv\\Scripts\\python.exe src\\ingestion\\hybrid_loader.py --years 2025 --round 10")
