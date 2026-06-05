/** WGS84 좌표 간 직선 거리(미터) — Haversine */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6_371_000
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/** 도보 약 N분 (평균 80m/분) */
export function estimateWalkMinutes(distanceM: number): number {
  if (!Number.isFinite(distanceM) || distanceM <= 0) return 1
  return Math.max(1, Math.round(distanceM / 80))
}
