import { useEffect, useMemo, useState } from 'react'
import { haversineDistanceMeters, estimateWalkMinutes } from '../lib/geoDistance'
import { formatStoreDistanceMeters } from '../lib/storeUi'

type LatLng = { lat: number; lng: number }

/** 브라우저 현재 위치 → 목적지 직선 거리(가게까지) */
export function useDistanceToCoords(target: LatLng | null) {
  const [userLocation, setUserLocation] = useState<LatLng | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (target == null) {
      setUserLocation(null)
      setLoading(false)
      return
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('위치 서비스를 사용할 수 없습니다.')
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const apply = (lat: number, lng: number) => {
      if (cancelled) return
      setUserLocation({ lat, lng })
      setLoading(false)
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => apply(pos.coords.latitude, pos.coords.longitude),
      () => {
        if (!cancelled) {
          setError('현재 위치를 가져오지 못했습니다.')
          setLoading(false)
        }
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    )

    const watchId = navigator.geolocation.watchPosition(
      (pos) => apply(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20_000 },
    )

    return () => {
      cancelled = true
      navigator.geolocation.clearWatch(watchId)
    }
  }, [target?.lat, target?.lng])

  const distanceMeters = useMemo(() => {
    if (!userLocation || !target) return null
    return haversineDistanceMeters(
      userLocation.lat,
      userLocation.lng,
      target.lat,
      target.lng,
    )
  }, [userLocation, target])

  const distanceLabel = useMemo(() => {
    if (distanceMeters == null) return ''
    return formatStoreDistanceMeters(distanceMeters) || ''
  }, [distanceMeters])

  const walkTimeLabel = useMemo(() => {
    if (distanceMeters == null) return ''
    return `도보 약 ${estimateWalkMinutes(distanceMeters)}분`
  }, [distanceMeters])

  return { userLocation, distanceLabel, walkTimeLabel, distanceMeters, loading, error }
}
