import { useCallback, useEffect, useMemo, useState } from 'react'
import { haversineDistanceMeters, estimateWalkMinutes } from '../lib/geoDistance'
import { GeolocationError, geolocationErrorMessage, getUserCoords } from '../lib/geolocation'
import { formatStoreDistanceMeters } from '../lib/storeUi'

type LatLng = { lat: number; lng: number }

/** 브라우저 현재 위치 → 목적지 직선 거리(가게까지) */
export function useDistanceToCoords(target: LatLng | null) {
  const [userLocation, setUserLocation] = useState<LatLng | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (target == null) {
      setUserLocation(null)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const coords = await getUserCoords()
      setUserLocation({ lat: coords.latitude, lng: coords.longitude })
    } catch (e) {
      setUserLocation(null)
      if (e instanceof GeolocationError) {
        setError(e.message)
      } else {
        setError(geolocationErrorMessage('UNKNOWN'))
      }
    } finally {
      setLoading(false)
    }
  }, [target?.lat, target?.lng])

  useEffect(() => {
    void load()
  }, [load])

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

  return { userLocation, distanceLabel, walkTimeLabel, distanceMeters, loading, error, retry: load }
}
