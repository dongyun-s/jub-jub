from datetime import timezone
from unittest import TestCase
from unittest.mock import patch

from pydantic import ValidationError

from pickup_time import PickupTimeRequest, predict_pickup_time


class PickupTimeTest(TestCase):
    def setUp(self) -> None:
        self.model_patcher = patch("pickup_time.MODEL_BUNDLE", None)
        self.model_patcher.start()
        self.addCleanup(self.model_patcher.stop)

    def test_predicts_duration_and_ready_time(self) -> None:
        request = PickupTimeRequest.model_validate(
            {
                "store_id": 1,
                "base_cooking_minutes": 15,
                "items": [{"menu_id": 10, "quantity": 2}],
                "waiting_order_count": 2,
                "requested_at": "2026-09-18T12:00:00+09:00",
            }
        )

        response = predict_pickup_time(request)

        self.assertEqual(response.estimated_minutes, 26)
        self.assertEqual(response.estimated_ready_at.isoformat(), "2026-09-18T12:26:00+09:00")
        self.assertEqual(response.method, "RULE_BASED_V1")

    def test_peak_hour_uses_seoul_time(self) -> None:
        request = PickupTimeRequest.model_validate(
            {
                "store_id": 1,
                "base_cooking_minutes": 15,
                "items": [{"menu_id": 10, "quantity": 1}],
                "waiting_order_count": 0,
                "requested_at": "2026-09-18T03:00:00+00:00",
            }
        )

        response = predict_pickup_time(request)

        self.assertEqual(response.estimated_minutes, 18)
        self.assertEqual(response.estimated_ready_at.tzinfo, timezone.utc)

    def test_rejects_invalid_quantities_and_naive_time(self) -> None:
        with self.assertRaises(ValidationError):
            PickupTimeRequest.model_validate(
                {
                    "store_id": 1,
                    "base_cooking_minutes": 15,
                    "items": [{"menu_id": 10, "quantity": 0}],
                    "waiting_order_count": -1,
                    "requested_at": "2026-09-18T12:00:00",
                }
            )

    def test_uses_loaded_machine_learning_model(self) -> None:
        class FixedModel:
            def predict(self, features: list[list[float]]) -> list[float]:
                return [22.4]

        request = PickupTimeRequest.model_validate(
            {
                "store_id": 1,
                "base_cooking_minutes": 15,
                "items": [{"menu_id": 10, "quantity": 2}],
                "waiting_order_count": 1,
                "requested_at": "2026-09-18T12:00:00+09:00",
            }
        )

        with patch("pickup_time.MODEL_BUNDLE", {
            "model": FixedModel(),
            "model_name": "RANDOM_FOREST",
            "mae": 1.25,
        }):
            response = predict_pickup_time(request)

        self.assertEqual(response.estimated_minutes, 22)
        self.assertEqual(response.method, "ML_RANDOM_FOREST_V1")

    def test_falls_back_to_rules_when_model_prediction_fails(self) -> None:
        class BrokenModel:
            def predict(self, features: list[list[float]]) -> list[float]:
                raise ValueError("broken model")

        request = PickupTimeRequest.model_validate(
            {
                "store_id": 1,
                "base_cooking_minutes": 15,
                "items": [{"menu_id": 10, "quantity": 1}],
                "waiting_order_count": 0,
                "requested_at": "2026-09-18T12:00:00+09:00",
            }
        )

        with patch("pickup_time.MODEL_BUNDLE", {"model": BrokenModel()}):
            response = predict_pickup_time(request)

        self.assertEqual(response.estimated_minutes, 18)
        self.assertEqual(response.method, "RULE_BASED_V1")
