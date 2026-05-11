/**
 * MapPage.tsx
 * 지도 페이지 (탭: 지도)
 * - 진행 중 주문 있으면: 픽업 목적지·경로·이동 수단(도보/자전거/차)
 * - 없으면: 주변 매장 목록·거리·픽업 예상 시간
 */

import {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { loadTmapScript } from '../../lib/tmap/loadTmapScript'
import { fetchTmapRoute } from '../../lib/tmap/tmapRouteApi'
import Layout from '../../components/Layout'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import { FEATURED_RESTAURANTS } from '../../constants'
import styles from './MapPage.module.css'

interface MapPageProps {
  onBack?: () => void
  onGoHome?: () => void
  onCartClick?: () => void
  onOrdersClick?: () => void
  onOrderStatusClick?: () => void
  /** 진행 주문 픽업: 주문 매장 상세로 (미넘기면 onStoreClick) */
  onPickupStoreDetail?: () => void
  onStoreClick?: () => void
  onMypageClick?: () => void
  onFavoritesClick?: () => void
  onNotificationsClick?: () => void
  /** true면 픽업 경로 뷰, false면 주변 매장 리스트 */
  hasActiveOrder?: boolean
  cartCount?: number
}

interface Location {
  lat: number
  lng: number
}

/** 주변 매장 목록 (데모) */
const nearbyStores = [
  {
    id: FEATURED_RESTAURANTS[0].id,
    name: FEATURED_RESTAURANTS[0].title,
    category: '피자',
    distance: '—',
    rating: FEATURED_RESTAURANTS[0].rating,
    pickupTime: '15-20분',
    image: FEATURED_RESTAURANTS[0].image,
    lat: FEATURED_RESTAURANTS[0].lat ?? 37.4979,
    lng: FEATURED_RESTAURANTS[0].lng ?? 127.0276,
  },
  {
    id: 2,
    name: '맘스터치 역삼점',
    category: '버거',
    distance: '250m',
    rating: 4.5,
    pickupTime: '10-15분',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop',
    lat: 37.4985,
    lng: 127.0285,
  },
  {
    id: 3,
    name: '스타벅스 테헤란로점',
    category: '카페',
    distance: '320m',
    rating: 4.7,
    pickupTime: '5-10분',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&h=200&fit=crop',
    lat: 37.4990,
    lng: 127.0290,
  },
]

/**
 * 진행 중 주문 픽업 목적지 (hasActiveOrder) — 좌표·이름은 주문 매장과 동일(FEATURED_RESTAURANTS[0])
 */
const ORDER_PICKUP_RESTAURANT = FEATURED_RESTAURANTS[0]

const destinationData = {
  storeName: ORDER_PICKUP_RESTAURANT.title,
  storeImage: ORDER_PICKUP_RESTAURANT.image,
  storeAddress: '서울 강남구 테헤란로 123 (데모)',
  lat: ORDER_PICKUP_RESTAURANT.lat ?? 37.4979,
  lng: ORDER_PICKUP_RESTAURANT.lng ?? 127.0276,
}

/** 주변 매장 탭 지도 기본 중심 (위치 권한 전) */
const MAP_DEFAULT_CENTER = { lat: destinationData.lat, lng: destinationData.lng }

const NEARBY_MAP_ZOOM = 16

/** mapWrap 하단부터 맛집 패널이 덮는 높이(px) */
function computeNearbyPanelOverlapPx(mapWrapEl: HTMLElement, panelEl: HTMLElement): number {
  const wrap = mapWrapEl.getBoundingClientRect()
  const panel = panelEl.getBoundingClientRect()
  // "덮는" 높이는 두 박스의 실제 교집합 높이로 계산해야 합니다.
  // (특히 카드가 `bottom: 5rem`처럼 바닥에 완전히 붙지 않는 경우,
  // 기존 wrap.bottom - panel.top 방식은 과대 계산될 수 있음)
  const top = Math.max(wrap.top, panel.top)
  const bottom = Math.min(wrap.bottom, panel.bottom)
  return Math.max(0, Math.round(bottom - top))
}

/**
 * 화면에서 특정 지점을 위로 옮기는 것과 동일한 효과를 내려면
 * 지도 중심 위도를 이 만큼 내려야 함(북반구, Web Mercator m/px → 약 111320m/°).
 */
function latDeltaForPanningCenterSouth(refLat: number, zoom: number, screenPixels: number): number {
  if (screenPixels === 0) return 0
  const circumference = 40075017
  const mPerPx = (circumference * Math.cos((refLat * Math.PI) / 180)) / (256 * Math.pow(2, zoom))
  return (screenPixels * mPerPx) / 111320
}

/** 티맵 LatLng(getCenter)에서 위경도 추출 */
function readLatLngFromCenter(ll: unknown): { lat: number; lng: number } | null {
  if (!ll || typeof ll !== 'object') return null
  const o = ll as Record<string, unknown>
  if (typeof o.lat === 'number' && typeof o.lng === 'number') return { lat: o.lat, lng: o.lng }
  if (typeof o._lat === 'number' && typeof o._lng === 'number') return { lat: o._lat, lng: o._lng }
  if (typeof o.lat === 'function' && typeof o.lng === 'function') {
    const lat = (o.lat as () => number)()
    const lng = (o.lng as () => number)()
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
  }
  return null
}

function readZoomLevel(map: unknown, fallback?: number): number | undefined {
  const m = map as { getZoom?: () => number; getZoomLevel?: () => number; zoom?: number }
  const z =
    (typeof m.getZoom === 'function' ? m.getZoom() : undefined) ??
    (typeof m.getZoomLevel === 'function' ? m.getZoomLevel() : undefined) ??
    (typeof m.zoom === 'number' ? m.zoom : undefined) ??
    fallback
  if (typeof z === 'number' && Number.isFinite(z)) return z
  return undefined
}

/**
 * fitBounds 직후: 가시 영역 아래쪽에 inset(px)만큼 비우는 효과 — 중심을 남쪽으로 옮겨 경로가 위로 밀림.
 * (티맵 fitBounds 두 번째 인자 margin이 동작하지 않는 경우 대비)
 */
function insetMapViewFromBottom(
  map: { getCenter?: () => unknown; setCenter?: (ll: unknown) => void },
  LatLng: new (la: number, ln: number) => unknown,
  bottomInsetPx: number,
  zoomFallback?: number,
  centerFallback?: { lat: number; lng: number }
) {
  if (bottomInsetPx <= 0) return
  const pos = readLatLngFromCenter(map.getCenter?.()) ?? centerFallback
  const z = readZoomLevel(map, zoomFallback)
  if (!pos || z == null || !map.setCenter) return
  const dLat = latDeltaForPanningCenterSouth(pos.lat, z, bottomInsetPx)
  map.setCenter(new LatLng(pos.lat - dLat, pos.lng))
}

function insetMapViewFromTop(
  map: { getCenter?: () => unknown; setCenter?: (ll: unknown) => void },
  LatLng: new (la: number, ln: number) => unknown,
  topInsetPx: number,
  zoomFallback?: number,
  centerFallback?: { lat: number; lng: number }
) {
  if (topInsetPx <= 0) return
  const pos = readLatLngFromCenter(map.getCenter?.()) ?? centerFallback
  const z = readZoomLevel(map, zoomFallback)
  if (!pos || z == null || !map.setCenter) return
  const dLat = latDeltaForPanningCenterSouth(pos.lat, z, topInsetPx)
  map.setCenter(new LatLng(pos.lat + dLat, pos.lng))
}

/** 진북 0° 기준 각도 → 8방위 한글 (나침반 표시용) */
function headingToOctantLabel(deg: number | null): string | null {
  if (deg == null || !Number.isFinite(deg)) return null
  const d = ((deg % 360) + 360) % 360
  const labels = ['북', '북동', '동', '남동', '남', '남서', '서', '북서']
  return labels[Math.round(d / 45) % 8] ?? null
}

export type MapTmapMarker = { lat: number; lng: number; title?: string; /** 정북 0°, 시계 방향, 진북 기준 */ headingDeg?: number }

type MapTmapCanvasProps = {
  className?: string
  center: { lat: number; lng: number }
  zoom?: number
  markers: MapTmapMarker[]
  polylinePath?: { lat: number; lng: number }[]
  fitMarkers?: boolean
  /** true면 fit 시 폴리라인 꼭짓점까지 bounds 확장(전체 경로 보기) */
  fitIncludePolyline?: boolean
  /**
   * 가시 영역 패딩(px). 픽업: 카드가 덮는 만큼 = bottom.
   * fit 후 (1) 이 패딩 기준으로 줌 조정 (2) bottom만큼 중심을 남쪽으로 패닝해 카드 위로 내용 올림.
   */
  fitBoundsPadding?: { top?: number; right?: number; bottom?: number; left?: number }
}

export type MapTmapHandle = {
  zoomIn: () => void
  zoomOut: () => void
}

type TmapSdk = {
  Map: new (
    el: HTMLElement,
    opts: { center: unknown; width: string; height: string; zoom: number }
  ) => {
    destroy: () => void
    zoomIn: () => void
    zoomOut: () => void
    setCenter: (ll: unknown) => void
    getCenter?: () => unknown
    getZoom?: () => number
    getZoomLevel?: () => number
    setZoom?: (z: number) => void
    setZoomLevel?: (z: number) => void
    fitBounds: (b: unknown) => void
    relayout?: () => void
  }
  LatLng: new (lat: number, lng: number) => unknown
  LatLngBounds: new () => { extend: (ll: unknown) => void }
  Marker: new (opts: Record<string, unknown>) => {
    setIconHTML?: (html: string) => void
    setMap?: (v: unknown) => void
  }
  Polyline: new (opts: { path: unknown[]; strokeColor: string; strokeWeight: number; map: unknown }) => {
    setMap?: (v: unknown) => void
  }
}

function getTmapv2(): TmapSdk | undefined {
  return (window as unknown as { Tmapv2?: TmapSdk }).Tmapv2
}

/** 진북 기준 방위(°) → 삼각 화설표 HTML (티맵 Marker iconHTML용) */
function headingArrowIconHtml(headingDeg: number): string {
  const d = ((headingDeg % 360) + 360) % 360
  return `<div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;transform:rotate(${d}deg);transform-origin:50% 55%;"><span style="display:block;width:0;height:0;border-left:11px solid transparent;border-right:11px solid transparent;border-bottom:24px solid #2563eb;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4));"></span></div>`
}

/** 티맵 Web 지도 캔버스 — 이 파일에서 MapPage와 함께 유지 */
export const MapTmapCanvas = forwardRef<MapTmapHandle, MapTmapCanvasProps>(function MapTmapCanvas(
  {
    className,
    center,
    zoom = 16,
    markers,
    polylinePath,
    fitMarkers = false,
    fitIncludePolyline = false,
    fitBoundsPadding,
  },
  ref
) {
  const centerRef = useRef(center)
  centerRef.current = center

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<{
    destroy: () => void
    zoomIn: () => void
    zoomOut: () => void
    relayout?: () => void
    setCenter: (ll: unknown) => void
    getCenter?: () => unknown
    getZoom?: () => number
    getZoomLevel?: () => number
    setZoom?: (z: number) => void
    setZoomLevel?: (z: number) => void
    fitBounds: (b: unknown) => void
  } | null>(null)
  const markerInstancesRef = useRef<Array<{ setMap?: (v: unknown) => void }>>([])
  const polylineInstanceRef = useRef<{ setMap?: (v: unknown) => void } | null>(null)
  const disconnectResizeRef = useRef<(() => void) | undefined>(undefined)
  /** 위치·경로·패딩이 같으면 fitBounds 생략(방위만 바뀔 때 줄 줌 튐 방지) */
  const lastFitBoundsKeyRef = useRef('')

  const [error, setError] = useState<string | null>(null)

  const markersJson = JSON.stringify(markers)
  const polyJson = JSON.stringify(polylinePath ?? [])
  const fitPaddingJson = JSON.stringify(fitBoundsPadding ?? null)

  useImperativeHandle(ref, () => ({
    zoomIn: () => mapRef.current?.zoomIn(),
    zoomOut: () => mapRef.current?.zoomOut(),
  }))

  const redrawOverlays = useCallback(() => {
    const map = mapRef.current
    const tv2 = getTmapv2()
    if (!map || !tv2?.Marker || !tv2?.LatLng || !tv2?.Polyline) return

    for (const m of markerInstancesRef.current) {
      try {
        m.setMap?.(null)
      } catch {
        /* noop */
      }
    }
    markerInstancesRef.current = []
    if (polylineInstanceRef.current) {
      try {
        polylineInstanceRef.current.setMap?.(null)
      } catch {
        /* noop */
      }
      polylineInstanceRef.current = null
    }

    let parsedMarkers: MapTmapMarker[]
    let parsedPoly: { lat: number; lng: number }[]
    try {
      parsedMarkers = JSON.parse(markersJson) as MapTmapMarker[]
      parsedPoly = JSON.parse(polyJson) as { lat: number; lng: number }[]
    } catch {
      return
    }

    const meanOfMarkers =
      parsedMarkers.length > 0
        ? {
            lat: parsedMarkers.reduce((s, m) => s + m.lat, 0) / parsedMarkers.length,
            lng: parsedMarkers.reduce((s, m) => s + m.lng, 0) / parsedMarkers.length,
          }
        : undefined

    const boundsFitKey =
      fitMarkers && parsedMarkers.length >= 2
        ? `${parsedMarkers.map((m) => `${m.lat},${m.lng}`).join('|')}|${fitIncludePolyline ? polyJson : ''}|${fitPaddingJson}`
        : null

    let didFit = false
    try {
      for (const mk of parsedMarkers) {
        const marker = new tv2.Marker({
          position: new tv2.LatLng(mk.lat, mk.lng),
          map,
          title: mk.title ?? '',
        })
        if (typeof mk.headingDeg === 'number' && Number.isFinite(mk.headingDeg)) {
          marker.setIconHTML?.(headingArrowIconHtml(mk.headingDeg))
        }
        markerInstancesRef.current.push(marker)
      }

      if (parsedPoly.length >= 2) {
        polylineInstanceRef.current = new tv2.Polyline({
          path: parsedPoly.map((p) => new tv2.LatLng(p.lat, p.lng)),
          strokeColor: '#4338ca',
          strokeWeight: 4,
          map,
        })
      }

      // 픽업 등: 마커+경로 bounds → fitBounds → (rAF) 가시영역 패딩만큼 줌·하단 패닝
      if (boundsFitKey && boundsFitKey !== lastFitBoundsKeyRef.current) {
        const extendBounds = (bounds: { extend: (ll: unknown) => void }) => {
          for (const mk of parsedMarkers) {
            bounds.extend(new tv2.LatLng(mk.lat, mk.lng))
          }
          if (fitIncludePolyline && parsedPoly.length >= 2) {
            for (const p of parsedPoly) {
              bounds.extend(new tv2.LatLng(p.lat, p.lng))
            }
          }
        }
        try {
          const bounds = new tv2.LatLngBounds()
          extendBounds(bounds)
          map.fitBounds(bounds)
          didFit = true
          lastFitBoundsKeyRef.current = boundsFitKey
        } catch {
          try {
            const bounds = new tv2.LatLngBounds()
            extendBounds(bounds)
            map.fitBounds(bounds)
            didFit = true
            lastFitBoundsKeyRef.current = boundsFitKey
          } catch {
            const c = centerRef.current
            map.setCenter(new tv2.LatLng(c.lat, c.lng))
          }
        }
      }
    } catch (e) {
      console.error('[MapTmapCanvas] 마커/경로 표시 실패:', e)
    }

    const zFallback = zoom
    const applyInsetOrCenter = () => {
      try {
        if (didFit && fitBoundsPadding) {
          const pad = fitBoundsPadding
          // 카드 영역을 제외한 "가시영역"의 세로 중앙으로 맞추기 위해 bottom의 절반만큼 패닝.
          // (bottom 전체로 패닝하면 fitBounds로 맞춘 경계가 위로 밀려 경로가 잘릴 수 있음)
          const b = pad.bottom ?? 0
          const panBottom = Math.max(0, Math.min(b, Math.round(b / 2) + 16))
          const t = pad.top ?? 0
          const zAfter = readZoomLevel(map, zFallback)
          if (panBottom > 0) insetMapViewFromBottom(map, tv2.LatLng, panBottom, zAfter, meanOfMarkers)
          if (t > 0) insetMapViewFromTop(map, tv2.LatLng, t, zAfter, meanOfMarkers)
        } else if (!didFit && (!boundsFitKey || boundsFitKey !== lastFitBoundsKeyRef.current)) {
          const c = centerRef.current
          map.setCenter(new tv2.LatLng(c.lat, c.lng))
        }
        map.relayout?.()
      } catch {
        /* noop */
      }
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(applyInsetOrCenter)
    })
  }, [markersJson, polyJson, fitMarkers, fitIncludePolyline, fitPaddingJson, fitBoundsPadding, zoom])

  const redrawRef = useRef(redrawOverlays)
  redrawRef.current = redrawOverlays

  useEffect(() => {
    redrawOverlays()
  }, [redrawOverlays])

  useEffect(() => {
    const appKey = (import.meta.env.VITE_TMAP_APP_KEY as string | undefined)?.trim()
    if (!appKey) {
      setError('VITE_TMAP_APP_KEY가 없습니다. frontend/.env에 앱키를 넣어 주세요.')
      return
    }

    const el = containerRef.current
    if (!el) return

    let cancelled = false
    setError(null)

    const initMap = (container: HTMLDivElement, tv2: TmapSdk) => {
      const { width: rw, height: rh } = container.getBoundingClientRect()
      const widthPx = Math.max(1, Math.floor(rw || container.clientWidth || 320))
      const heightPx = Math.max(1, Math.floor(rh || container.clientHeight || 240))

      const c0 = centerRef.current
      const map = new tv2.Map(container, {
        center: new tv2.LatLng(c0.lat, c0.lng),
        width: `${widthPx}px`,
        height: `${heightPx}px`,
        zoom,
        // 기본 줌 슬라이더(오른쪽 검은 바) 비활성화 시도
        // (SDK 버전에 따라 옵션명이 다를 수 있어, CSS로도 별도 숨김 처리함)
        ...( { zoomControl: false } as unknown as Record<string, unknown> ),
      })
      mapRef.current = map

      const syncMapSize = () => {
        try {
          const { width: w, height: h } = container.getBoundingClientRect()
          const nw = Math.max(1, Math.floor(w || 0))
          const nh = Math.max(1, Math.floor(h || 0))
          const m = map as { setSize?: (w: number, h: number) => void }
          m.setSize?.(nw, nh)
          map.relayout?.()
        } catch {
          /* noop */
        }
      }

      disconnectResizeRef.current?.()
      const ro = new ResizeObserver(() => {
        syncMapSize()
        requestAnimationFrame(() => {
          syncMapSize()
          map.relayout?.()
        })
      })
      ro.observe(container)
      disconnectResizeRef.current = () => ro.disconnect()

      requestAnimationFrame(() => {
        try {
          syncMapSize()
          redrawRef.current()
        } catch {
          /* noop */
        }
      })
    }

    ;(async () => {
      try {
        await loadTmapScript(appKey)
        if (cancelled || !containerRef.current) return

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (cancelled || !containerRef.current) return
            const tv2 = getTmapv2()
            if (!tv2?.Map) {
              setError(
                '티맵 SDK(Tmapv2)가 없습니다. 앱키·콘솔 Web URL(예: http://localhost:5173)·네트워크를 확인하세요.'
              )
              return
            }
            initMap(containerRef.current, tv2)
          })
        })
      } catch (e) {
        console.error('[MapTmapCanvas] 초기화 실패:', e)
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '티맵 스크립트를 불러오지 못했습니다. 네트워크·앱키를 확인하세요.')
        }
      }
    })()

    return () => {
      cancelled = true
      lastFitBoundsKeyRef.current = ''
      disconnectResizeRef.current?.()
      disconnectResizeRef.current = undefined
      for (const m of markerInstancesRef.current) {
        try {
          m.setMap?.(null)
        } catch {
          /* noop */
        }
      }
      markerInstancesRef.current = []
      if (polylineInstanceRef.current) {
        try {
          polylineInstanceRef.current.setMap?.(null)
        } catch {
          /* noop */
        }
        polylineInstanceRef.current = null
      }
      if (mapRef.current) {
        try {
          mapRef.current.destroy()
        } catch {
          /* noop */
        }
        mapRef.current = null
      }
    }
  }, [zoom])

  useEffect(() => {
    // fitMarkers: 카메라는 fitBounds + 하단 패딩 패닝이 담당. 여기서 중점 setCenter 하면
    // 줌만 넓게 남고 중심만 바뀌어 경로·마커가 화면 밖(특히 북쪽)으로 밀릴 수 있음.
    if (fitMarkers) return
    const map = mapRef.current
    const tv2 = getTmapv2()
    if (!map || !tv2?.LatLng) return
    try {
      map.setCenter(new tv2.LatLng(center.lat, center.lng))
      map.relayout?.()
    } catch {
      /* noop */
    }
  }, [center.lat, center.lng, fitMarkers])

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {error ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(243, 244, 246, 0.95)',
            color: '#374151',
            fontSize: '0.875rem',
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      ) : null}
    </div>
  )
})

function MapPage({
  onBack: _onBack,
  onGoHome,
  onCartClick,
  onOrdersClick,
  onOrderStatusClick,
  onPickupStoreDetail,
  onStoreClick,
  onMypageClick,
  onFavoritesClick,
  onNotificationsClick,
  hasActiveOrder,
  cartCount = 0,
}: MapPageProps) {
  const [transportMode, setTransportMode] = useState<'walk' | 'bike' | 'car'>('walk')
  /** 픽업 탭: Tmap 경로 API 폴리라인·요약 */
  const [pickupRoutePath, setPickupRoutePath] = useState<{ lat: number; lng: number }[] | null>(null)
  const [pickupRouteDistanceM, setPickupRouteDistanceM] = useState<number | null>(null)
  const [pickupRouteTimeSec, setPickupRouteTimeSec] = useState<number | null>(null)
  /** 기기 방위(°). GPS heading / DeviceOrientation — 지원 단말·권한에만 값 존재 */
  const [userHeadingDeg, setUserHeadingDeg] = useState<number | null>(null)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [distance, setDistance] = useState('--')
  const [walkTime, setWalkTime] = useState('--')
  /** watchPosition 과 getCurrentPosition 이 서로 덮어쓰지 않도록 마지막 반영 좌표 */
  const lastWatchLocationRef = useRef<{ lat: number; lng: number } | null>(null)
  /** 주변 매장 탭: 하단 맛집 시트 펼침(지도는 mapWrap 전체 크기 유지, 시트는 오버레이) */
  const [nearbySheetOpen, setNearbySheetOpen] = useState(true)
  /** 픽업 탭: 하단 카드 접힘/펼침 */
  const [pickupSheetOpen, setPickupSheetOpen] = useState(true)
  const pickupMapRef = useRef<MapTmapHandle>(null)
  const nearbyMapRef = useRef<MapTmapHandle>(null)
  /** 모바일 가로(landscape) 여부: 고정 bottom 패딩이 화면 높이에 비해 커질 때 마커가 잘림 */
  const [isLandscape, setIsLandscape] = useState(() => (typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false))
  const nearbyMapWrapRef = useRef<HTMLDivElement>(null)
  const nearbyStoresPanelRef = useRef<HTMLDivElement>(null)
  /** 스토어 패널이 가리는 높이 — 가시 영역 중앙에 맞게 지도 중심만 남쪽으로 이동(마커 좌표는 그대로) */
  const [nearbyPanelOverlapPx, setNearbyPanelOverlapPx] = useState(0)

  const measureNearbyPanelOverlap = useCallback(() => {
    if (hasActiveOrder) return
    const m = nearbyMapWrapRef.current
    const p = nearbyStoresPanelRef.current
    if (m && p) setNearbyPanelOverlapPx(computeNearbyPanelOverlapPx(m, p))
  }, [hasActiveOrder])

  useLayoutEffect(() => {
    if (hasActiveOrder) return
    const mapEl = nearbyMapWrapRef.current
    const panel = nearbyStoresPanelRef.current
    if (!mapEl || !panel) return
    measureNearbyPanelOverlap()
    const ro = new ResizeObserver(() => measureNearbyPanelOverlap())
    ro.observe(mapEl)
    ro.observe(panel)
    const vv = window.visualViewport
    if (vv) {
      vv.addEventListener('resize', measureNearbyPanelOverlap)
      vv.addEventListener('scroll', measureNearbyPanelOverlap)
    }
    return () => {
      ro.disconnect()
      if (vv) {
        vv.removeEventListener('resize', measureNearbyPanelOverlap)
        vv.removeEventListener('scroll', measureNearbyPanelOverlap)
      }
    }
  }, [hasActiveOrder, nearbySheetOpen, measureNearbyPanelOverlap])

  useEffect(() => {
    if (hasActiveOrder) return
    const id = window.setTimeout(() => measureNearbyPanelOverlap(), 380)
    return () => window.clearTimeout(id)
  }, [hasActiveOrder, nearbySheetOpen, measureNearbyPanelOverlap])

  useEffect(() => {
    if (hasActiveOrder) setNearbyPanelOverlapPx(0)
  }, [hasActiveOrder])

  useEffect(() => {
    const update = () => setIsLandscape(window.innerWidth > window.innerHeight)
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  const pickupMapWrapRef = useRef<HTMLDivElement>(null)
  const pickupBottomCardRef = useRef<HTMLDivElement>(null)
  // 픽업 카드 높이만큼 지도 카메라를 올리는 보정은 제거됨.

  const pickupMarkers = useMemo(() => {
    const dest = { lat: destinationData.lat, lng: destinationData.lng, title: destinationData.storeName }
    if (currentLocation) {
      return [
        {
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          title: '현재 위치',
          ...(userHeadingDeg != null ? { headingDeg: userHeadingDeg } : {}),
        },
        dest,
      ]
    }
    return [dest]
  }, [currentLocation, userHeadingDeg, destinationData])

  const pickupPolyline = useMemo(() => {
    if (!currentLocation) return undefined
    return [
      { lat: currentLocation.lat, lng: currentLocation.lng },
      { lat: destinationData.lat, lng: destinationData.lng },
    ]
  }, [currentLocation, destinationData])

  const pickupPolylineForMap = useMemo(() => {
    if (pickupRoutePath && pickupRoutePath.length >= 2) return pickupRoutePath
    return pickupPolyline
  }, [pickupRoutePath, pickupPolyline])

  const pickupMapCenter = useMemo(
    () =>
      currentLocation
        ? {
            lat: (currentLocation.lat + destinationData.lat) / 2,
            lng: (currentLocation.lng + destinationData.lng) / 2,
          }
        : { lat: destinationData.lat, lng: destinationData.lng },
    [currentLocation, destinationData]
  )

  const nearbyMarkers = useMemo(() => {
    if (!currentLocation) return []
    return [
      {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        title: '내 위치',
        ...(userHeadingDeg != null ? { headingDeg: userHeadingDeg } : {}),
      },
    ]
  }, [currentLocation, userHeadingDeg])

  const userHeadingLabel = useMemo(() => headingToOctantLabel(userHeadingDeg), [userHeadingDeg])

  const nearbyMapCenter = currentLocation ?? MAP_DEFAULT_CENTER

  /**
   * 마커는 실제 lat/lng 유지. 하단 시트로 가려진 만큼 “가시 영역의 세로 중앙”이
   * 전체 지도 중앙보다 위에 있으므로, 중심만 남쪽으로 옮겨 같은 효과를 냄.
   */
  const nearbyMapCenterForView = useMemo(() => {
    if (nearbyPanelOverlapPx <= 0) return nearbyMapCenter
    const shiftPx = nearbyPanelOverlapPx / 2
    const dLat = latDeltaForPanningCenterSouth(nearbyMapCenter.lat, NEARBY_MAP_ZOOM, shiftPx)
    return { lat: nearbyMapCenter.lat - dLat, lng: nearbyMapCenter.lng }
  }, [nearbyMapCenter.lat, nearbyMapCenter.lng, nearbyPanelOverlapPx])

  // 현재 위치 가져오기
  const getCurrentLocation = () => {
    console.log('[MapPage] 위치 가져오기 시작')
    setIsLoadingLocation(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      console.log('[MapPage] Geolocation API 지원 안됨')
      setLocationError('이 브라우저에서는 위치 서비스를 지원하지 않습니다.')
      setIsLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        console.log('[MapPage] 위치 가져오기 성공:', latitude, longitude)
        const loc = { lat: latitude, lng: longitude }
        setCurrentLocation(loc)
        lastWatchLocationRef.current = loc
        setIsLoadingLocation(false)
        
        // 거리 및 시간 계산 (간단한 직선거리 계산)
        const dist = calculateDistance(latitude, longitude, destinationData.lat, destinationData.lng)
        console.log('[MapPage] 목적지까지 거리:', dist, 'm')
        setDistance(dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`)
        
        // 도보 시간 계산 (평균 보행 속도: 분당 80m)
        const walkMinutes = Math.round(dist / 80)
        setWalkTime(`도보 ${walkMinutes}분`)
      },
      (error) => {
        console.log('[MapPage] 위치 가져오기 실패:', error.code, error.message)
        setIsLoadingLocation(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.')
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError('위치 정보를 사용할 수 없습니다.')
            break
          case error.TIMEOUT:
            setLocationError('위치 요청 시간이 초과되었습니다. 다시 시도해주세요.')
            break
          default:
            setLocationError('위치를 가져올 수 없습니다.')
        }
      },
      {
        /** false였을 때 네트워크 추정·오래된 캐시로 수십~수백 m 어긋날 수 있음 */
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    )
  }

  // 두 좌표 사이의 거리 계산 (Haversine 공식)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3 // 지구 반지름 (미터)
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  const goPickupStoreDetail = () => {
    if (onPickupStoreDetail) onPickupStoreDetail()
    else onStoreClick?.()
  }

  // 컴포넌트 마운트 시 현재 위치 가져오기
  useEffect(() => {
    getCurrentLocation()
  }, [])

  /**
   * 단말이 바라보는 방향(진북 기준). — GPS 이동 방향(coords.heading) · 나침반(DeviceOrientation).
   * 데스크톱/권한 거부 시 값 없음. iOS Safari는 보통 사용자 제스처 후에만 센서 이벤트가 옴.
   */
  useEffect(() => {
    let watchId: number | undefined
    let rafId = 0
    let pendingDeg: number | null = null

    const flushHeading = () => {
      rafId = 0
      if (pendingDeg != null) {
        setUserHeadingDeg(pendingDeg)
        pendingDeg = null
      }
    }

    const scheduleHeading = (raw: number) => {
      if (!Number.isFinite(raw)) return
      pendingDeg = ((raw % 360) + 360) % 360
      if (!rafId) rafId = requestAnimationFrame(flushHeading)
    }

    const onOri = (e: DeviceOrientationEvent) => {
      const webkit = e as DeviceOrientationEvent & { webkitCompassHeading?: number }
      if (typeof webkit.webkitCompassHeading === 'number' && !Number.isNaN(webkit.webkitCompassHeading)) {
        scheduleHeading(webkit.webkitCompassHeading)
        return
      }
      if (e.absolute && e.alpha != null && !Number.isNaN(e.alpha)) {
        scheduleHeading(360 - e.alpha)
      }
    }

    if (navigator.geolocation) {
      let lastPush = 0
      const minIntervalMs = 2500
      const minMoveM = 10
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, heading, accuracy } = pos.coords
          const now = Date.now()
          if (now - lastPush >= minIntervalMs) {
            const prev = lastWatchLocationRef.current
            const moved =
              prev == null
                ? true
                : calculateDistance(prev.lat, prev.lng, latitude, longitude) >= minMoveM
            if (moved) {
              lastPush = now
              const loc = { lat: latitude, lng: longitude }
              lastWatchLocationRef.current = loc
              setCurrentLocation(loc)
              if (import.meta.env.DEV && typeof accuracy === 'number' && Number.isFinite(accuracy)) {
                console.debug('[MapPage] 위치 보정 · 대략 오차 ±m:', Math.round(accuracy))
              }
            }
          }
          if (heading != null && !Number.isNaN(heading)) scheduleHeading(heading)
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
      )
    }

    window.addEventListener('deviceorientationabsolute', onOri as EventListener)
    window.addEventListener('deviceorientation', onOri as EventListener)

    return () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId)
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('deviceorientationabsolute', onOri as EventListener)
      window.removeEventListener('deviceorientation', onOri as EventListener)
    }
  }, [])

  /** 진행 주문·픽업 탭: Tmap 경로 API로 폴리라인·거리 */
  useEffect(() => {
    if (!hasActiveOrder || !currentLocation) {
      setPickupRoutePath(null)
      setPickupRouteDistanceM(null)
      setPickupRouteTimeSec(null)
      return
    }

    const appKey = (import.meta.env.VITE_TMAP_APP_KEY as string | undefined)?.trim()
    if (!appKey) {
      setPickupRoutePath(null)
      return
    }

    let cancelled = false

    fetchTmapRoute(transportMode, appKey, currentLocation, {
      lat: destinationData.lat,
      lng: destinationData.lng,
    })
      .then((r) => {
        if (cancelled) return
        setPickupRoutePath(r.path.length >= 2 ? r.path : null)
        setPickupRouteDistanceM(
          typeof r.totalDistanceM === 'number' && Number.isFinite(r.totalDistanceM) ? r.totalDistanceM : null
        )
        setPickupRouteTimeSec(
          typeof r.totalTimeSec === 'number' && Number.isFinite(r.totalTimeSec) ? r.totalTimeSec : null
        )
      })
      .catch((e) => {
        if (cancelled) return
        console.warn('[MapPage] 경로 API 실패:', e)
        setPickupRoutePath(null)
        setPickupRouteDistanceM(null)
        setPickupRouteTimeSec(null)
      })

    return () => {
      cancelled = true
    }
  }, [hasActiveOrder, currentLocation, transportMode, destinationData])

  // 현재 위치 변경 시 주변 매장 거리 업데이트
  const getDistanceText = (storeLat: number, storeLng: number): string => {
    if (!currentLocation) return '--'
    const dist = calculateDistance(currentLocation.lat, currentLocation.lng, storeLat, storeLng)
    return dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`
  }

  // 도보 시간 계산
  const getWalkTimeText = (storeLat: number, storeLng: number): string => {
    if (!currentLocation) return '--'
    const dist = calculateDistance(currentLocation.lat, currentLocation.lng, storeLat, storeLng)
    const minutes = Math.round(dist / 80)
    return `${minutes}분`
  }

  const pickupDistanceLabel = useMemo(() => {
    if (
      pickupRouteDistanceM != null &&
      Number.isFinite(pickupRouteDistanceM) &&
      pickupRouteDistanceM >= 0
    ) {
      if (pickupRouteDistanceM < 1000) return `${Math.round(pickupRouteDistanceM)}m`
      return `${(pickupRouteDistanceM / 1000).toFixed(1)}km`
    }
    return distance
  }, [pickupRouteDistanceM, distance])

  const pickupTimeLabel = useMemo(() => {
    if (pickupRouteTimeSec != null && Number.isFinite(pickupRouteTimeSec) && pickupRouteTimeSec >= 0) {
      const min = Math.max(1, Math.round(pickupRouteTimeSec / 60))
      if (transportMode === 'walk') return `도보 약 ${min}분`
      if (transportMode === 'bike') return `자전거 약 ${min}분`
      return `차량 약 ${min}분`
    }
    return walkTime
  }, [pickupRouteTimeSec, transportMode, walkTime])

  return (
    <Layout showBackground={false}>
      <div className={styles.root}>
        {hasActiveOrder ? (
          <>
            <Header
              title="픽업 경로 안내"
              onFavoriteClick={onFavoritesClick}
              onNotificationsClick={onNotificationsClick}
            />

            <div className={styles.transportRow}>
              <button
                onClick={() => setTransportMode('walk')}
                className={`${styles.transportTab} ${transportMode === 'walk' ? styles.transportTabActive : styles.transportTabInactive}`}
              >
                도보
              </button>
              <button
                onClick={() => setTransportMode('bike')}
                className={`${styles.transportTab} ${transportMode === 'bike' ? styles.transportTabActive : styles.transportTabInactive}`}
              >
                자전거
              </button>
              <button
                onClick={() => setTransportMode('car')}
                className={`${styles.transportTab} ${transportMode === 'car' ? styles.transportTabActive : styles.transportTabInactive}`}
              >
                자동차
              </button>
            </div>

            <div ref={pickupMapWrapRef} className={styles.mapWrap}>
              <MapTmapCanvas
                className={styles.mapIframe}
                ref={pickupMapRef}
                center={pickupMapCenter}
                zoom={currentLocation ? 15 : 16}
                markers={pickupMarkers}
                polylinePath={pickupPolylineForMap}
                fitMarkers={Boolean(currentLocation)}
                fitIncludePolyline={Boolean(currentLocation && pickupPolylineForMap && pickupPolylineForMap.length >= 2)}
                fitBoundsPadding={{
                  top: 0,
                  right: 12,
                  bottom: pickupSheetOpen ? (isLandscape ? 120 : 200) : isLandscape ? 60 : 90,
                  left: 12,
                }}
              />
              <div className={styles.zoomGroup} aria-label="지도 줌 컨트롤">
                <button
                  type="button"
                  className={styles.zoomButton}
                  onClick={() => pickupMapRef.current?.zoomIn()}
                  aria-label="확대"
                >
                  <span className={`material-symbols-outlined ${styles.zoomIcon}`}>add</span>
                </button>
                <button
                  type="button"
                  className={styles.zoomButton}
                  onClick={() => pickupMapRef.current?.zoomOut()}
                  aria-label="축소"
                >
                  <span className={`material-symbols-outlined ${styles.zoomIcon}`}>remove</span>
                </button>
              </div>
              <button
                onClick={getCurrentLocation}
                disabled={isLoadingLocation}
                className={styles.locationButton}
              >
                {isLoadingLocation ? (
                  <span className={`material-symbols-outlined ${styles.locationIconLoading}`}>sync</span>
                ) : (
                  <span className={`material-symbols-outlined ${styles.locationIcon}`}>my_location</span>
                )}
              </button>

              {userHeadingLabel && currentLocation && (
                <div
                  className={styles.headingBadge}
                  title="기기가 가리키는 대략 방향(나침반·이동 중일 때 GPS 방위, 지원 단말만)"
                >
                  <span className={`material-symbols-outlined ${styles.headingBadgeIcon}`}>explore</span>
                  {userHeadingLabel}
                </div>
              )}

              {locationError && (
                <div className={styles.locationError}>
                  <p className={styles.locationErrorText}>{locationError}</p>
                </div>
              )}

              <div ref={pickupBottomCardRef} className={styles.bottomCard}>
                <div
                  className={`${styles.pickupSheet} ${pickupSheetOpen ? styles.pickupSheetExpanded : styles.pickupSheetCollapsed}`}
                >
                  <button
                    type="button"
                    className={styles.sheetHandle}
                    onClick={() => setPickupSheetOpen((v) => !v)}
                    aria-expanded={pickupSheetOpen}
                    aria-label={pickupSheetOpen ? '픽업 카드 접기' : '픽업 카드 펼치기'}
                  >
                    <span className={styles.sheetHandleBar} />
                    <div className={styles.sheetHandleRow}>
                      <div className={styles.pickupSheetTitleRow}>
                        <span className={`material-symbols-outlined ${styles.storesPanelIcon}`}>route</span>
                        <span className={styles.pickupSheetTitle}>픽업 정보</span>
                      </div>
                      <span
                        className={`material-symbols-outlined ${styles.sheetChevron} ${pickupSheetOpen ? styles.sheetChevronOpen : ''}`}
                      >
                        expand_more
                      </span>
                    </div>
                  </button>

                  <div className={styles.pickupSheetBody}>
                    <div className={styles.destCard}>
                      <div className={styles.destCardHeader}>
                        <img
                          src={destinationData.storeImage}
                          alt={destinationData.storeName}
                          className={styles.destImage}
                        />
                        <div className={styles.destInfo}>
                          <h3 className={styles.destTime}>{pickupTimeLabel}</h3>
                          <p className={styles.destMeta}>
                            {pickupDistanceLabel} •{' '}
                            {currentLocation
                              ? pickupRoutePath
                                ? '경로 기준(Tmap)'
                                : '직선 거리(경로 로드 전·실패 시)'
                              : '위치 확인 중...'}
                          </p>
                        </div>
                        {currentLocation && (
                          <div className={styles.locationOk}>
                            <span className={`material-symbols-outlined ${styles.locationOkIcon}`}>check_circle</span>
                            <span className={styles.locationOkText}>위치 확인됨</span>
                          </div>
                        )}
                      </div>

                      <div className={styles.destActions}>
                        <button
                          type="button"
                          onClick={goPickupStoreDetail}
                          className={`${styles.destActionBtn} ${styles.destActionSecondary}`}
                        >
                          <span className={`material-symbols-outlined ${styles.destActionIcon}`}>store</span>
                          매장 정보
                        </button>
                        <button
                          type="button"
                          onClick={onOrderStatusClick}
                          className={`${styles.destActionBtn} ${styles.destActionPrimary}`}
                        >
                          <span className={`material-symbols-outlined ${styles.destActionIcon}`}>receipt_long</span>
                          주문·현황
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <Header
              title="주변 매장"
              onFavoriteClick={onFavoritesClick}
              onNotificationsClick={onNotificationsClick}
            />

            <div className={styles.searchBarWrap}>
              <div className={styles.searchBar}>
                <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
                <input
                  type="text"
                  placeholder="장소, 매장 검색"
                  className={styles.searchInput}
                />
              </div>
            </div>

            <div ref={nearbyMapWrapRef} className={styles.mapWrap}>
              <MapTmapCanvas
                className={styles.mapIframe}
                ref={nearbyMapRef}
                center={nearbyMapCenterForView}
                zoom={NEARBY_MAP_ZOOM}
                markers={nearbyMarkers}
                fitMarkers={false}
              />
              <div className={styles.zoomGroup} aria-label="지도 줌 컨트롤">
                <button
                  type="button"
                  className={styles.zoomButton}
                  onClick={() => nearbyMapRef.current?.zoomIn()}
                  aria-label="확대"
                >
                  <span className={`material-symbols-outlined ${styles.zoomIcon}`}>add</span>
                </button>
                <button
                  type="button"
                  className={styles.zoomButton}
                  onClick={() => nearbyMapRef.current?.zoomOut()}
                  aria-label="축소"
                >
                  <span className={`material-symbols-outlined ${styles.zoomIcon}`}>remove</span>
                </button>
              </div>

              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={isLoadingLocation}
                className={styles.locationButton}
              >
                {isLoadingLocation ? (
                  <span className={`material-symbols-outlined ${styles.locationIconLoading}`}>sync</span>
                ) : currentLocation ? (
                  <span className={`material-symbols-outlined ${styles.locationIcon}`}>my_location</span>
                ) : (
                  <span className={`material-symbols-outlined ${styles.locationIconMuted}`}>my_location</span>
                )}
              </button>

              {userHeadingLabel && currentLocation && (
                <div
                  className={styles.headingBadge}
                  title="기기가 가리키는 대략 방향(나침반·이동 중일 때 GPS 방위, 지원 단말만)"
                >
                  <span className={`material-symbols-outlined ${styles.headingBadgeIcon}`}>explore</span>
                  {userHeadingLabel}
                </div>
              )}

              {locationError && (
                <div className={styles.locationError}>
                  <p className={styles.locationErrorText}>{locationError}</p>
                </div>
              )}

              <div className={styles.bottomCard}>
                <div
                  ref={nearbyStoresPanelRef}
                  className={`${styles.storesPanel} ${nearbySheetOpen ? styles.nearbySheetExpanded : styles.nearbySheetCollapsed}`}
                  onTransitionEnd={(e) => {
                    if (e.propertyName !== 'max-height' || e.target !== e.currentTarget) return
                    measureNearbyPanelOverlap()
                  }}
                >
                  <button
                    type="button"
                    className={styles.sheetHandle}
                    onClick={() => setNearbySheetOpen((v) => !v)}
                    aria-expanded={nearbySheetOpen}
                    aria-label={nearbySheetOpen ? '맛집 목록 접기' : '맛집 목록 펼치기'}
                  >
                    <span className={styles.sheetHandleBar} />
                    <div className={styles.sheetHandleRow}>
                      <div className={styles.storesPanelTitleRow}>
                        <span className={`material-symbols-outlined ${styles.storesPanelIcon}`}>takeout_dining</span>
                        <span className={styles.storesPanelTitle}>내 주변 포장 맛집</span>
                        {currentLocation && (
                          <span className={styles.locationBadge}>
                            <span className={`material-symbols-outlined ${styles.locationBadgeIcon}`}>check_circle</span>
                            위치 확인됨
                          </span>
                        )}
                        {isLoadingLocation && (
                          <span className={styles.loadingBadge}>
                            <span className={`material-symbols-outlined ${styles.loadingBadgeIcon}`}>sync</span>
                            위치 확인 중
                          </span>
                        )}
                      </div>
                      <span
                        className={`material-symbols-outlined ${styles.sheetChevron} ${nearbySheetOpen ? styles.sheetChevronOpen : ''}`}
                      >
                        keyboard_arrow_up
                      </span>
                    </div>
                  </button>

                  <div className={styles.storesPanelBody}>
                    <div className={styles.storesList}>
                      {nearbyStores.map((store) => (
                        <button
                          key={store.id}
                          type="button"
                          onClick={onStoreClick}
                          className={styles.storeRow}
                        >
                          <img src={store.image} alt={store.name} className={styles.storeRowImage} />
                          <div className={styles.storeRowInfo}>
                            <h3 className={styles.storeRowName}>{store.name}</h3>
                            <div className={styles.storeRowMeta}>
                              <span className={styles.storeRowStar}>
                                <span className={`material-symbols-outlined ${styles.starIcon}`}>star</span>
                                {store.rating}
                              </span>
                              <span className={styles.storeRowDot}>•</span>
                              <span className={styles.storeRowDistance}>
                                {currentLocation ? getDistanceText(store.lat, store.lng) : store.distance}
                              </span>
                              <span className={styles.storeRowDot}>•</span>
                              <span className={styles.storeRowTime}>
                                도보 {currentLocation ? getWalkTimeText(store.lat, store.lng) : store.pickupTime}
                              </span>
                            </div>
                          </div>
                          <span className={`material-symbols-outlined ${styles.storeRowChevron}`}>chevron_right</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 하단 네비게이션 */}
        <BottomNav 
          active="map" 
          cartCount={cartCount}
          onNavigate={(page) => {
            if (page === 'home') onGoHome?.()
            if (page === 'orders') onOrdersClick?.()
            if (page === 'cart') onCartClick?.()
            if (page === 'mypage') onMypageClick?.()
          }}
        />
      </div>
    </Layout>
  )
}

export default MapPage
