from datetime import datetime, timedelta, timezone
import logging
import os
from pathlib import Path
from typing import Annotated

import joblib
from pydantic import BaseModel, Field, field_validator


PositiveInt = Annotated[int, Field(strict=True, gt=0)]
NonNegativeInt = Annotated[int, Field(strict=True, ge=0)]
SEOUL_TIMEZONE = timezone(timedelta(hours=9))
DEFAULT_MODEL_PATH = Path(__file__).resolve().parent / "models" / "pickup_time_model.joblib"
MODEL_PATH = Path(os.getenv("PICKUP_MODEL_PATH", DEFAULT_MODEL_PATH))
LOGGER = logging.getLogger(__name__)


def load_model_bundle(path: Path = MODEL_PATH) -> dict | None:
    if not path.exists():
        return None
    try:
        bundle = joblib.load(path)
        if not isinstance(bundle, dict) or "model" not in bundle:
            return None
        return bundle
    except Exception:
        # 모델 파일이 손상되거나 버전이 맞지 않아도 규칙 기반 예측으로 서비스는 계속 동작한다.
        LOGGER.exception("픽업시간 모델을 불러오지 못해 규칙 기반 예측을 사용합니다.")
        return None


MODEL_BUNDLE = load_model_bundle()


class PickupItem(BaseModel):
    menu_id: PositiveInt
    quantity: PositiveInt


class PickupTimeRequest(BaseModel):
    """Spring Boot가 주문 한 건의 픽업 시간을 예측할 때 보내는 데이터."""

    store_id: PositiveInt
    base_cooking_minutes: PositiveInt
    items: list[PickupItem] = Field(min_length=1)
    waiting_order_count: NonNegativeInt
    requested_at: datetime

    @field_validator("requested_at")
    @classmethod
    def require_timezone(cls, value: datetime) -> datetime:
        # 시간대 정보가 있어야 요청 시각을 한국 시간으로 변환해 피크 시간을 판별할 수 있다.
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("requested_at must include a UTC offset")
        return value


class PickupTimeResponse(BaseModel):
    estimated_minutes: int
    estimated_ready_at: datetime
    method: str
    reason: str


def predict_pickup_time(request: PickupTimeRequest) -> PickupTimeResponse:
    """학습 모델을 우선 사용하고, 사용할 수 없으면 규칙 기반으로 계산한다."""

    if MODEL_BUNDLE is not None:
        try:
            return predict_with_model(request, MODEL_BUNDLE)
        except Exception:
            LOGGER.exception("머신러닝 예측에 실패해 규칙 기반 예측을 사용합니다.")
    return predict_with_rules(request)


def predict_with_model(request: PickupTimeRequest, bundle: dict) -> PickupTimeResponse:
    total_quantity = sum(item.quantity for item in request.items)
    local_time = request.requested_at.astimezone(SEOUL_TIMEZONE)
    features = [[
        request.base_cooking_minutes,
        total_quantity,
        len(request.items),
        request.waiting_order_count,
        int(11 <= local_time.hour < 14 or 17 <= local_time.hour < 20),
        int(local_time.isoweekday() >= 6),
    ]]
    estimated_minutes = max(1, int(round(float(bundle["model"].predict(features)[0]))))
    model_name = str(bundle.get("model_name", "UNKNOWN"))
    mae = bundle.get("mae", "unknown")
    return PickupTimeResponse(
        estimated_minutes=estimated_minutes,
        estimated_ready_at=request.requested_at + timedelta(minutes=estimated_minutes),
        method=f"ML_{model_name}_V1",
        reason=f"Machine learning prediction (validation MAE: {mae} min)",
    )


def predict_with_rules(request: PickupTimeRequest) -> PickupTimeResponse:
    """모델 파일이 없거나 로딩에 실패했을 때 사용하는 규칙 기반 대체 계산이다."""

    # 첫 번째 메뉴는 매장의 기본 조리시간에 포함하고, 추가 수량만 보정한다.
    # 추가 수량과 대기 주문의 보정값은 학습된 값이 아니라 임시로 정한 기준이다.
    total_quantity = sum(item.quantity for item in request.items)
    extra_item_minutes = max(total_quantity - 1, 0) * 2
    waiting_minutes = request.waiting_order_count * 3

    # 입력이 UTC여도 한국 시간의 점심·저녁 피크 시간에 맞춰 보정한다.
    local_hour = request.requested_at.astimezone(SEOUL_TIMEZONE).hour
    peak_minutes = 3 if 11 <= local_hour < 14 or 17 <= local_hour < 20 else 0

    estimated_minutes = (
        request.base_cooking_minutes
        + extra_item_minutes
        + waiting_minutes
        + peak_minutes
    )
    reason = (
        f"Base cooking {request.base_cooking_minutes} min"
        f" + extra items {extra_item_minutes} min"
        f" + waiting orders {waiting_minutes} min"
        f" + peak hours {peak_minutes} min"
    )
    # 응답 시각은 요청의 시간대 정보를 유지하고, 저장 시 Spring에서 변환할 수 있다.
    return PickupTimeResponse(
        estimated_minutes=estimated_minutes,
        estimated_ready_at=request.requested_at + timedelta(minutes=estimated_minutes),
        method="RULE_BASED_V1",
        reason=reason,
    )
