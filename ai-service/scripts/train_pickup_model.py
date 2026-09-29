import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = ROOT / "data" / "pickup_training_data.csv"
DEFAULT_MODEL = ROOT / "models" / "pickup_time_model.joblib"
DEFAULT_METRICS = ROOT / "models" / "pickup_time_metrics.json"
FEATURE_NAMES = [
    "base_cooking_minutes",
    "total_item_quantity",
    "distinct_menu_count",
    "waiting_order_count",
    "is_peak_hour",
    "is_weekend",
]


def load_dataset(path: Path) -> tuple[list[list[float]], list[float]]:
    features: list[list[float]] = []
    targets: list[float] = []

    with path.open(encoding="utf-8") as file:
        for row in csv.DictReader(file):
            hour = int(row["request_hour"])
            day_of_week = int(row["day_of_week"])
            features.append([
                float(row["base_cooking_minutes"]),
                float(row["total_item_quantity"]),
                float(row["distinct_menu_count"]),
                float(row["waiting_order_count"]),
                float(11 <= hour < 14 or 17 <= hour < 20),
                float(day_of_week >= 6),
            ])
            targets.append(float(row["actual_cooking_minutes"]))

    if len(features) < 10:
        raise ValueError("학습하려면 최소 10건의 데이터가 필요합니다.")
    return features, targets


def train(data_path: Path, model_path: Path, metrics_path: Path) -> dict[str, object]:
    features, targets = load_dataset(data_path)
    x_train, x_test, y_train, y_test = train_test_split(
        features, targets, test_size=0.2, random_state=42
    )
    candidates = {
        "LINEAR_REGRESSION": LinearRegression(),
        "RANDOM_FOREST": RandomForestRegressor(
            n_estimators=50,
            max_depth=5,
            random_state=42,
            n_jobs=1,
        ),
    }

    results: dict[str, float] = {}
    trained_models = {}
    for name, model in candidates.items():
        model.fit(x_train, y_train)
        results[name] = round(float(mean_absolute_error(y_test, model.predict(x_test))), 4)
        trained_models[name] = model

    selected_name = min(results, key=results.get)
    trained_at = datetime.now(timezone.utc).isoformat()
    artifact = {
        "model": trained_models[selected_name],
        "model_name": selected_name,
        "feature_names": FEATURE_NAMES,
        "mae": results[selected_name],
        "training_rows": len(features),
        "trained_at": trained_at,
    }

    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, model_path)

    metrics = {
        "training_rows": len(features),
        "test_rows": len(y_test),
        "mae_by_model": results,
        "selected_model": selected_name,
        "trained_at": trained_at,
    }
    metrics_path.write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8")
    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="픽업시간 예측 모델을 학습합니다.")
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    parser.add_argument("--metrics", type=Path, default=DEFAULT_METRICS)
    args = parser.parse_args()

    metrics = train(args.data, args.model, args.metrics)
    print(json.dumps(metrics, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
