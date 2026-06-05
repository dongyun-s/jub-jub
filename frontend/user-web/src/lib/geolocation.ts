export type GeoCoords = { latitude: number; longitude: number }

export type GeolocationFailureReason =
  | 'UNAVAILABLE'
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'UNKNOWN'

export class GeolocationError extends Error {
  readonly reason: GeolocationFailureReason

  constructor(reason: GeolocationFailureReason, message?: string) {
    super(message ?? geolocationErrorMessage(reason))
    this.name = 'GeolocationError'
    this.reason = reason
  }
}

export function geolocationErrorMessage(reason: GeolocationFailureReason): string {
  switch (reason) {
    case 'UNAVAILABLE':
      return '이 브라우저에서는 위치(GPS) 서비스를 사용할 수 없습니다.'
    case 'PERMISSION_DENIED':
      return '위치(GPS) 권한을 허용해 주세요. 브라우저 주소창 옆 자물쇠에서 위치를 켜거나, 아래 버튼으로 다시 시도해 주세요.'
    case 'POSITION_UNAVAILABLE':
      return '위치 정보를 가져올 수 없습니다. GPS가 켜져 있는지 확인해 주세요.'
    case 'TIMEOUT':
      return '위치 요청 시간이 초과되었습니다. GPS 권한을 허용한 뒤 다시 시도해 주세요.'
    default:
      return '현재 위치를 확인할 수 없습니다. GPS 권한을 허용해 주세요.'
  }
}

function mapNativeErrorCode(code: number): GeolocationFailureReason {
  switch (code) {
    case 1:
      return 'PERMISSION_DENIED'
    case 2:
      return 'POSITION_UNAVAILABLE'
    case 3:
      return 'TIMEOUT'
    default:
      return 'UNKNOWN'
  }
}

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 12_000,
  maximumAge: 0,
}

/** 브라우저 GPS — 실패 시 GeolocationError (fallback 없음) */
export function getUserCoords(): Promise<GeoCoords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new GeolocationError('UNAVAILABLE'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
      },
      (err) => {
        reject(new GeolocationError(mapNativeErrorCode(err.code)))
      },
      GEO_OPTIONS,
    )
  })
}

/** 픽업 거리 저장 등 — fallback 좌표가 있으면 실패 시 대체, 없으면 GeolocationError */
export function resolveUserCoords(fallback?: GeoCoords | null): Promise<GeoCoords> {
  return getUserCoords().catch((e) => {
    if (fallback) return fallback
    throw e
  })
}
