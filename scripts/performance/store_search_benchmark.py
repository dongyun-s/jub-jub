#!/usr/bin/env python3
"""Measure end-to-end latency for the deployed store search API.

Example:
    python3 scripts/performance/store_search_benchmark.py \
        --base-url https://api.example.com --latitude 37.5665 --longitude 126.9780 \
        --requests 100 --concurrency 5

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
    parser.add_argument("--concurrency", type=int, default=1,
                        help="동시에 요청을 보내는 작업자 수. 기본값은 순차 요청입니다.")
    parser.add_argument("--timeout", type=float, default=10)
    args = parser.parse_args()

    if args.warmup < 0 or args.requests < 1 or args.concurrency < 1:
        parser.error("--warmup은 0 이상, --requests와 --concurrency는 1 이상이어야 합니다.")
    if args.concurrency > args.requests:
        parser.error("--concurrency는 --requests보다 클 수 없습니다.")

    base = urlsplit(args.base_url)
    if base.scheme not in ("http", "https") or not base.hostname:
        parser.error("--base-url에는 http 또는 https 주소를 지정해야 합니다.")

    query = urlencode({
        "sortBy": args.sort_by,
        "latitude": args.latitude,
        "longitude": args.longitude,
    })
    path = f"{base.path.rstrip('/')}/api/v1/stores/sorted?{query}"
    worker_counts = [args.requests // args.concurrency] * args.concurrency
    for index in range(args.requests % args.concurrency):
        worker_counts[index] += 1

    from concurrent.futures import ThreadPoolExecutor

    with ThreadPoolExecutor(max_workers=args.concurrency) as executor:
        futures = [
            executor.submit(
                run_worker,
                base.scheme,
                base.hostname,
                base.port,
                path,
                args.timeout,
                args.warmup,
                count,
            )
            for count in worker_counts
        ]
        samples = [sample for future in futures for sample in future.result()]

    print(f"requests={len(samples)} warmupPerWorker={args.warmup} concurrency={args.concurrency} sortBy={args.sort_by}")
    print(f"meanMs={statistics.fmean(samples):.2f}")
    print(f"p50Ms={percentile(samples, 0.50):.2f}")
    print(f"p95Ms={percentile(samples, 0.95):.2f}")
    print(f"maxMs={max(samples):.2f}")


def run_worker(
    scheme: str,
    hostname: str,
    port: int | None,
    path: str,
    timeout: float,
    warmup: int,
    request_count: int,
) -> list[float]:
    connection_type = http.client.HTTPSConnection if scheme == "https" else http.client.HTTPConnection
    connection = connection_type(hostname, port, timeout=timeout)
    try:
        for _ in range(warmup):
            status = request(connection, path)
            if status < 200 or status >= 300:
                raise RuntimeError(f"워밍업 요청이 HTTP {status}를 반환했습니다.")

        samples = []
        for _ in range(request_count):
            started_at = time.perf_counter_ns()
            status = request(connection, path)
            elapsed_ms = (time.perf_counter_ns() - started_at) / 1_000_000
            if status < 200 or status >= 300:
                raise RuntimeError(f"검색 API가 HTTP {status}를 반환했습니다. 측정을 중단합니다.")
            samples.append(elapsed_ms)
        return samples
    finally:
        connection.close()


def request(connection: http.client.HTTPConnection, path: str) -> int:
    connection.request("GET", path, headers={"Accept": "application/json"})
    response = connection.getresponse()
    response.read()
    return response.status


if __name__ == "__main__":
    main()
