from fastapi import FastAPI

from pickup_time import PickupTimeRequest, PickupTimeResponse, predict_pickup_time

app = FastAPI(title="JubJub AI Service", version="0.1.0")


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict/pickup-time", response_model=PickupTimeResponse, tags=["prediction"])
def pickup_time(request: PickupTimeRequest) -> PickupTimeResponse:
    """요청 데이터를 검증한 뒤 픽업 준비 시간 계산 함수에 전달한다."""
    return predict_pickup_time(request)
