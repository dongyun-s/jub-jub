/**
 * Tmap Open API — 경로(도보 / 자전거 / 자동차) 조회
 * @see https://skopenapi.readme.io/reference
 */

export type TmapTransportMode = 'walk' | 'bike' | 'car'

export type TmapRoutePoint = { lat: number; lng: number }

export type TmapRouteResult = {
  path: TmapRoutePoint[]
  totalDistanceM?: number
  totalTimeSec?: number
  /** 안내 포인트 설명(출발·안내·도착 등) */
  steps: string[]
}

const API_BASE = 'https://apis.openapi.sk.com'

function routeUrl(mode: TmapTransportMode): string {
  switch (mode) {
    case 'walk':
      return `${API_BASE}/tmap/routes/pedestrian?version=1&format=json`
    case 'car':
      return `${API_BASE}/tmap/routes?version=1&format=json`
    case 'bike':
      return `${API_BASE}/tmap/routes/bicycle?version=1&format=json`
    default:
      return `${API_BASE}/tmap/routes/pedestrian?version=1&format=json`
  }
}

type GeoFeature = {
  geometry?: {
    type?: string
    coordinates?: unknown
  }
  properties?: Record<string, unknown>
}

function appendLineString(
  path: TmapRoutePoint[],
  coordinates: number[][]
): void {
  for (const c of coordinates) {
    if (!Array.isArray(c) || c.length < 2) continue
    const lng = Number(c[0])
    const lat = Number(c[1])
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    const last = path[path.length - 1]
    if (last && last.lat === lat && last.lng === lng) continue
    path.push({ lat, lng })
  }
}

export function parseTmapRouteGeoJson(data: { features?: GeoFeature[] }): TmapRouteResult {
  const features = data.features ?? []
  const path: TmapRoutePoint[] = []
  let totalDistanceM: number | undefined
  let totalTimeSec: number | undefined
  const steps: string[] = []

  for (const f of features) {
    const geom = f.geometry
    const props = f.properties ?? {}
    if (geom?.type === 'LineString' && Array.isArray(geom.coordinates)) {
      appendLineString(path, geom.coordinates as number[][])
      continue
    }
    if (geom?.type === 'Point' && Array.isArray(geom.coordinates)) {
      if (typeof props.totalDistance === 'number') totalDistanceM = props.totalDistance
      if (typeof props.totalTime === 'number') totalTimeSec = props.totalTime
      const desc = props.description
      if (typeof desc === 'string' && desc.trim().length > 0) {
        steps.push(desc.trim())
      }
    }
  }

  return { path, totalDistanceM, totalTimeSec, steps }
}

function buildJsonBody(
  mode: TmapTransportMode,
  start: TmapRoutePoint,
  end: TmapRoutePoint
): Record<string, string | number> {
  const common: Record<string, string | number> = {
    startX: start.lng,
    startY: start.lat,
    endX: end.lng,
    endY: end.lat,
    startName: '출발',
    endName: '도착',
    reqCoordType: 'WGS84GEO',
    resCoordType: 'WGS84GEO',
  }
  if (mode === 'car') {
    common.searchOption = '0'
  }
  return common
}

async function postRoute(
  mode: TmapTransportMode,
  appKey: string,
  start: TmapRoutePoint,
  end: TmapRoutePoint
): Promise<unknown> {
  const url = routeUrl(mode)
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      appKey,
    },
    body: JSON.stringify(buildJsonBody(mode, start, end)),
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`경로 API 오류 ${res.status}${text ? `: ${text.slice(0, 120)}` : ''}`)
  }
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new Error('경로 응답을 JSON으로 파싱할 수 없습니다.')
  }
}

/**
 * 이동 수단에 맞는 경로를 요청합니다.
 * 자전거 API가 계정·엔드포인트에 따라 비활성일 수 있어, 실패 시 도보 경로로 대체합니다.
 */
export async function fetchTmapRoute(
  mode: TmapTransportMode,
  appKey: string,
  start: TmapRoutePoint,
  end: TmapRoutePoint
): Promise<TmapRouteResult> {
  const key = appKey.trim()
  if (!key) throw new Error('Tmap 앱 키가 없습니다.')

  const parse = (raw: unknown): TmapRouteResult => {
    if (!raw || typeof raw !== 'object') throw new Error('경로 응답 형식이 올바르지 않습니다.')
    return parseTmapRouteGeoJson(raw as { features?: GeoFeature[] })
  }

  if (mode === 'bike') {
    try {
      const raw = await postRoute('bike', key, start, end)
      const parsed = parse(raw)
      if (parsed.path.length >= 2) return parsed
    } catch {
      /* 자전거 미지원·오류 시 도보로 */
    }
    const raw = await postRoute('walk', key, start, end)
    return parse(raw)
  }

  const raw = await postRoute(mode, key, start, end)
  return parse(raw)
}
