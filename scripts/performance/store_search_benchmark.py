#!/usr/bin/env python3
"""Measure sequential end-to-end latency for the deployed store search API.

Example:
    python3 scripts/performance/store_search_benchmark.py \
        --base-url https://api.example.com --latitude 37.5665 --longitude 126.9780

Run against a quiet environment with the same URL, coordinates, and options
before and after a change. This reports client-observed latency; the backend
also logs AOP measurements as `performance operation=store.search`.
"""

import argparse
import http.client
import math
import statistics
import time
from urllib.parse import urlencode, urlsplit


def percentile(samples: list[float], value: float) -> float:
    ordered = sorted(samples)
    index = max(0, math.ceil(value * len(ordered)) - 1)
    return ordered[index]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", required=True, help="Deployed API origin, for example https://api.example.com")
    parser.add_argument("--latitude", required=True, type=float)
    parser.add_argument("--longitude", required=True, type=float)
    parser.add_argument("--sort-by", choices=("DISTANCE", "RATING"), default="DISTANCE")
    parser.add_argument("--warmup", type=int, default=10)
    parser.add_argument("--requests", type=int, default=100)
    parser.add_argument("--timeout", type=float, default=10)
    args = parser.parse_args()

    if args.warmup < 0 or args.requests < 1:
        parser.error("--warmup은 0 이상, --requests는 1 이상이어야 합니다.")

    base = urlsplit(args.base_url)
    if base.scheme not in ("http", "https") or not base.hostname:
        parser.error("--base-url에는 http 또는 https 주소를 지정해야 합니다.")

    query = urlencode({
        "sortBy": args.sort_by,
        "latitude": args.latitude,
        "longitude": args.longitude,
    })
    path = f"{base.path.rstrip('/')}/api/v1/stores/sorted?{query}"
    connection_type = http.client.HTTPSConnection if base.scheme == "https" else http.client.HTTPConnection
    connection = connection_type(base.hostname, base.port, timeout=args.timeout)

    try:
        for _ in range(args.warmup):
            request(connection, path)

        samples = []
        for _ in range(args.requests):
            started_at = time.perf_counter_ns()
            status = request(connection, path)
            elapsed_ms = (time.perf_counter_ns() - started_at) / 1_000_000
            if status < 200 or status >= 300:
                raise RuntimeError(f"검색 API가 HTTP {status}를 반환했습니다. 측정을 중단합니다.")
            samples.append(elapsed_ms)
    finally:
        connection.close()

    print(f"requests={len(samples)} warmup={args.warmup} sortBy={args.sort_by}")
    print(f"meanMs={statistics.fmean(samples):.2f}")
    print(f"p50Ms={percentile(samples, 0.50):.2f}")
    print(f"p95Ms={percentile(samples, 0.95):.2f}")
    print(f"maxMs={max(samples):.2f}")


def request(connection: http.client.HTTPConnection, path: str) -> int:
    connection.request("GET", path, headers={"Accept": "application/json"})
    response = connection.getresponse()
    response.read()
    return response.status


if __name__ == "__main__":
    main()
