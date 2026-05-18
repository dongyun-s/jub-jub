export type GeoCoords = { latitude: number; longitude: number }

/** 픽업 완료 API용 — 브라우저 위치, 실패 시 fallback 좌표 */
export function resolveUserCoords(fallback?: GeoCoords | null): Promise<GeoCoords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (fallback) {
        resolve(fallback)
        return
      }
      reject(new Error('GEO_UNAVAILABLE'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
      },
      () => {
        if (fallback) {
          resolve(fallback)
          return
        }
        reject(new Error('GEO_DENIED'))
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    )
  })
}
