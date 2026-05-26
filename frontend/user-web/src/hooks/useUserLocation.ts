import { useEffect, useState } from 'react'
import { resolveUserCoords, type GeoCoords } from '../lib/geolocation'

/** 매장 정렬 API 폴백 (강남역 인근) */
export const DEFAULT_STORE_COORDS: GeoCoords = {
  latitude: 37.4979,
  longitude: 127.0276,
}

export function useUserLocation() {
  const [coords, setCoords] = useState<GeoCoords | null>(null)
  const [loading, setLoading] = useState(true)
  const [usedFallback, setUsedFallback] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void resolveUserCoords(DEFAULT_STORE_COORDS)
      .then((c) => {
        if (cancelled) return
        setCoords(c)
        setUsedFallback(
          c.latitude === DEFAULT_STORE_COORDS.latitude &&
            c.longitude === DEFAULT_STORE_COORDS.longitude,
        )
      })
      .catch(() => {
        if (!cancelled) {
          setCoords(DEFAULT_STORE_COORDS)
          setUsedFallback(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { coords, loading, usedFallback }
}
