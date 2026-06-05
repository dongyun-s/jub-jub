import { useCallback, useEffect, useState } from 'react'
import { GeolocationError, getUserCoords, type GeoCoords } from '../lib/geolocation'

export function useUserLocation() {
  const [coords, setCoords] = useState<GeoCoords | null>(null)
  const [loading, setLoading] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [needsPermission, setNeedsPermission] = useState(false)

  const retry = useCallback(() => {
    setLoading(true)
    setLocationError(null)
    return getUserCoords()
      .then((c) => {
        setCoords(c)
        setNeedsPermission(false)
        setLocationError(null)
      })
      .catch((e) => {
        setCoords(null)
        if (e instanceof GeolocationError) {
          setLocationError(e.message)
          setNeedsPermission(
            e.reason === 'PERMISSION_DENIED' ||
              e.reason === 'TIMEOUT' ||
              e.reason === 'POSITION_UNAVAILABLE',
          )
        } else {
          setLocationError('현재 위치를 확인할 수 없습니다. GPS 권한을 허용해 주세요.')
          setNeedsPermission(true)
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    void retry()
  }, [retry])

  return { coords, loading, locationError, needsPermission, retry }
}
