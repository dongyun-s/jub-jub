import csv
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase

import joblib

from scripts.generate_training_data import generate_dataset
from scripts.train_pickup_model import train


class TrainingPipelineTest(TestCase):
    def test_generates_data_and_saves_trained_model(self) -> None:
        with TemporaryDirectory() as directory:
            root = Path(directory)
            data_path = root / "training.csv"
            model_path = root / "model.joblib"
            metrics_path = root / "metrics.json"

            generate_dataset(data_path, rows=30, seed=42)
            metrics = train(data_path, model_path, metrics_path)

            with data_path.open(encoding="utf-8") as file:
                rows = list(csv.DictReader(file))

            self.assertEqual(len(rows), 30)
            self.assertTrue(model_path.exists())
            self.assertTrue(metrics_path.exists())
            self.assertEqual(metrics["training_rows"], 30)
            self.assertIn("model", joblib.load(model_path))
