import argparse
import csv
import random
from pathlib import Path


DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / "data" / "pickup_training_data.csv"
STORE_BASE_MINUTES = {1: 10, 2: 15, 3: 20}


def is_peak_hour(hour: int) -> bool:
    return 11 <= hour < 14 or 17 <= hour < 20


def generate_row(rng: random.Random) -> dict[str, int | float | str]:
    store_id = rng.choice(list(STORE_BASE_MINUTES))
    base_minutes = STORE_BASE_MINUTES[store_id]
    total_quantity = rng.randint(1, 8)
    distinct_menu_count = rng.randint(1, min(total_quantity, 4))
    waiting_order_count = rng.randint(0, 5)
    request_hour = rng.randint(10, 22)
    day_of_week = rng.randint(1, 7)

    # 실제 매장 데이터가 충분하지 않은 초기 단계이므로 조리시간에 영향을 주는 조건을 가정한다.
    # 약간의 무작위 오차를 섞어 모든 데이터가 완전히 같은 공식으로 보이지 않게 만든다.
    actual_minutes = (
        base_minutes
        + max(total_quantity - 1, 0) * 1.8
        + max(distinct_menu_count - 1, 0) * 0.8
        + waiting_order_count * 2.8
        + (3.0 if is_peak_hour(request_hour) else 0.0)
        + (1.0 if day_of_week >= 6 else 0.0)
        + rng.gauss(0, 1.2)
    )

    return {
        "data_source": "SIMULATED",
        "store_id": store_id,
        "base_cooking_minutes": base_minutes,
        "total_item_quantity": total_quantity,
        "distinct_menu_count": distinct_menu_count,
        "waiting_order_count": waiting_order_count,
        "request_hour": request_hour,
        "day_of_week": day_of_week,
        "actual_cooking_minutes": round(max(actual_minutes, 5.0), 2),
    }


def generate_dataset(output: Path, rows: int, seed: int) -> None:
    rng = random.Random(seed)
    records = [generate_row(rng) for _ in range(rows)]
    output.parent.mkdir(parents=True, exist_ok=True)

    with output.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=list(records[0]))
        writer.writeheader()
        writer.writerows(records)

    print(f"시뮬레이션 데이터 {rows}건 생성 완료: {output}")


def main() -> None:
    parser = argparse.ArgumentParser(description="픽업시간 학습용 시뮬레이션 데이터를 생성합니다.")
    parser.add_argument("--rows", type=int, default=150)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    if args.rows < 10:
        parser.error("rows는 10 이상이어야 합니다.")
    generate_dataset(args.output, args.rows, args.seed)


if __name__ == "__main__":
    main()
