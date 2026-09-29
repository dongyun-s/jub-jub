/**
 * 티맵 Marker iconHTML — 현재 위치·카테고리별 매장 핀
 */
import { CATEGORY_TABS } from '../constants/categories'

export type MapTmapMarkerKind = 'user' | 'store' | 'destination'

export type MapTmapMarker = {
  lat: number
  lng: number
  title?: string
  /** 정북 0°, 시계 방향 (user) */
  headingDeg?: number
  kind?: MapTmapMarkerKind
  /** 한식, 중식, 카페 … */
  category?: string
}

type CategoryTheme = {
  label: string
  emoji: string
  from: string
  to: string
  glow: string
}

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  한식: { label: '한식', emoji: '🍚', from: '#f97316', to: '#ea580c', glow: 'rgba(249,115,22,.45)' },
  중식: { label: '중식', emoji: '🥟', from: '#ef4444', to: '#dc2626', glow: 'rgba(239,68,68,.45)' },
  일식: { label: '일식', emoji: '🍣', from: '#f472b6', to: '#db2777', glow: 'rgba(244,114,182,.45)' },
  치킨: { label: '치킨', emoji: '🍗', from: '#f59e0b', to: '#d97706', glow: 'rgba(245,158,11,.45)' },
  피자: { label: '피자', emoji: '🍕', from: '#fb923c', to: '#ea580c', glow: 'rgba(251,146,60,.45)' },
  카페: { label: '카페', emoji: '☕', from: '#a16207', to: '#78350f', glow: 'rgba(161,98,7,.4)' },
  분식: { label: '분식', emoji: '🍜', from: '#a855f7', to: '#7c3aed', glow: 'rgba(168,85,247,.45)' },
  양식: { label: '양식', emoji: '🥩', from: '#6366f1', to: '#4f46e5', glow: 'rgba(99,102,241,.45)' },
  패스트푸드: { label: '패스트푸드', emoji: '🍔', from: '#eab308', to: '#ca8a04', glow: 'rgba(234,179,8,.45)' },
  디저트: { label: '디저트', emoji: '🍰', from: '#ec4899', to: '#be185d', glow: 'rgba(236,72,153,.45)' },
  야식: { label: '야식', emoji: '🌙', from: '#475569', to: '#1e293b', glow: 'rgba(71,85,105,.5)' },
}

const DEFAULT_STORE_THEME: CategoryTheme = {
  label: '매장',
  emoji: '🍽️',
  from: '#ec4899',
  to: '#f6319a',
  glow: 'rgba(246,49,154,.45)',
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
}

/** 티맵 iconHTML — 동일 출처 절대 URL */
function jubJubLogoMarkerUrl(): string {
  if (typeof window === 'undefined') return '/logo.png'
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/?$/, '/')
  return `${window.location.origin}${base}logo.png`
}

/** API·UI 라벨을 던전 카테고리 탭 이름으로 맞춤 */
export function resolveCategoryTheme(category?: string | null): CategoryTheme {
  const raw = (category ?? '').trim()
  if (!raw) return DEFAULT_STORE_THEME
  if (CATEGORY_THEMES[raw]) return CATEGORY_THEMES[raw]
  for (const tab of CATEGORY_TABS) {
    if (tab === '전체') continue
    if (raw.includes(tab) || tab.includes(raw)) return CATEGORY_THEMES[tab] ?? DEFAULT_STORE_THEME
  }
  return { ...DEFAULT_STORE_THEME, label: raw }
}

function userLocationMarkerHtml(headingDeg?: number): string {
  const hasHeading = typeof headingDeg === 'number' && Number.isFinite(headingDeg)
  const rot = hasHeading ? ((headingDeg! % 360) + 360) % 360 : 0
  const logoSrc = escapeHtml(jubJubLogoMarkerUrl())
  const arrow = hasHeading
    ? `<div style="position:absolute;left:50%;top:0;width:0;height:0;margin-left:-8px;transform:rotate(${rot}deg);transform-origin:50% 24px;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:18px solid #f6319a;filter:drop-shadow(0 1px 3px rgba(0,0,0,.2));z-index:2;"></div>`
    : ''
  return `<div style="position:relative;width:56px;height:56px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 4px 12px rgba(246,49,154,.35));" title="내 위치">
    ${arrow}
    <div style="position:absolute;width:50px;height:50px;border-radius:50%;background:rgba(246,49,154,.14);border:2px solid rgba(246,49,154,.28);"></div>
    <div style="position:relative;width:42px;height:42px;border-radius:50%;background:linear-gradient(145deg,#fff,#fff7fb);border:3px solid #fff;box-shadow:0 2px 10px rgba(15,23,42,.12);display:flex;align-items:center;justify-content:center;overflow:hidden;box-sizing:border-box;">
      <img src="${logoSrc}" alt="" width="34" height="34" style="width:34px;height:34px;object-fit:contain;display:block;pointer-events:none;" />
    </div>
    <div style="position:absolute;left:50%;bottom:2px;width:8px;height:8px;margin-left:-4px;border-radius:50%;background:#f6319a;border:2px solid #fff;box-shadow:0 1px 4px rgba(246,49,154,.5);"></div>
  </div>`
}

/** 카테고리 이모지 핀 (피자→🍕, 햄버거→🍔 …) */
function storePinHtml(theme: CategoryTheme, size: 'md' | 'lg', title?: string): string {
  const dim = size === 'lg' ? 48 : 40
  const font = size === 'lg' ? 22 : 18
  const tip = title ? escapeHtml(title) : theme.label
  return `<div style="width:${dim + 8}px;height:${dim + 14}px;filter:drop-shadow(0 4px 10px ${theme.glow});" title="${tip}">
    <div style="width:${dim}px;height:${dim}px;margin:0 auto;background:linear-gradient(145deg,${theme.from},${theme.to});border-radius:50% 50% 50% 6px;transform:rotate(-45deg);border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-sizing:border-box;">
      <span style="display:block;transform:rotate(45deg);font-size:${font}px;line-height:1;">${theme.emoji}</span>
    </div>
  </div>`
}

export type MarkerIconLayout = {
  width: number
  height: number
  /** 지도 좌표에 맞출 핀 끝(하단 중앙) */
  anchorX: number
  anchorY: number
}

function markerKind(mk: MapTmapMarker): MapTmapMarkerKind {
  return mk.kind ?? (mk.headingDeg != null ? 'user' : 'store')
}

export function getMarkerIconLayout(mk: MapTmapMarker): MarkerIconLayout {
  const kind = markerKind(mk)
  if (kind === 'user') return { width: 56, height: 56, anchorX: 28, anchorY: 56 }
  if (kind === 'destination') return { width: 56, height: 62, anchorX: 28, anchorY: 62 }
  return { width: 48, height: 54, anchorX: 24, anchorY: 54 }
}

function svgEncode(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** setIconHTML 미동작 시 icon 폴백용 SVG */
export function buildMarkerSvgDataUrl(mk: MapTmapMarker): string | null {
  const kind = markerKind(mk)
  if (kind === 'user') {
    return svgEncode(
      `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="24" fill="rgba(246,49,154,.14)" stroke="rgba(246,49,154,.35)" stroke-width="2"/>
        <circle cx="28" cy="28" r="18" fill="#fff7fb" stroke="#fff" stroke-width="3"/>
        <circle cx="28" cy="28" r="12" fill="#f6319a"/>
        <circle cx="28" cy="50" r="5" fill="#f6319a" stroke="#fff" stroke-width="2"/>
      </svg>`,
    )
  }
  const theme = resolveCategoryTheme(mk.category)
  const layout = getMarkerIconLayout(mk)
  const w = layout.width
  const h = layout.height - 6
  return svgEncode(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${theme.from}"/>
          <stop offset="100%" stop-color="${theme.to}"/>
        </linearGradient>
      </defs>
      <path d="M${w / 2} ${h} C${w / 2 + 18} ${h} ${w - 4} ${h - 22} ${w - 4} ${h / 2} C${w - 4} 8 8 8 8 ${h / 2} C8 ${h - 22} ${w / 2 - 18} ${h} ${w / 2} ${h}Z" fill="url(#g)" stroke="#fff" stroke-width="3"/>
      <text x="${w / 2}" y="${h / 2 + 6}" text-anchor="middle" font-size="18">${theme.emoji}</text>
    </svg>`,
  )
}

/** 티맵 Marker.setIconHTML 용 HTML */
export function buildMarkerIconHtml(mk: MapTmapMarker): string | null {
  const kind = markerKind(mk)
  if (kind === 'user') {
    return userLocationMarkerHtml(mk.headingDeg)
  }
  const theme = resolveCategoryTheme(mk.category)
  // 픽업 목적지도 같은 카테고리 이모지 핀 (뱃지 없이 심플)
  return storePinHtml(theme, kind === 'destination' ? 'lg' : 'md', mk.title)
}

type TmapMarkerLike = {
  setIconHTML?: (html: string) => void
  setIconHtml?: (html: string) => void
  setIcon?: (url: string) => void
  setOffset?: (p: unknown) => void
}

type TmapMarkerSdk = {
  Size?: new (w: number, h: number) => unknown
  Point?: new (x: number, y: number) => unknown
}

/** HTML 아이콘 적용 + 앵커 보정, 실패 시 SVG icon 폴백 */
export function applyTmapMarkerAppearance(
  marker: TmapMarkerLike,
  mk: MapTmapMarker,
  tv2: TmapMarkerSdk,
  iconHtml: string,
): void {
  const layout = getMarkerIconLayout(mk)
  const wrapped = `<div style="width:${layout.width}px;height:${layout.height}px;overflow:visible;pointer-events:none;line-height:0;">${iconHtml}</div>`

  let htmlApplied = false
  if (typeof marker.setIconHTML === 'function') {
    marker.setIconHTML(wrapped)
    htmlApplied = true
  } else if (typeof marker.setIconHtml === 'function') {
    marker.setIconHtml(wrapped)
    htmlApplied = true
  }

  if (!htmlApplied && typeof marker.setIcon === 'function') {
    const svg = buildMarkerSvgDataUrl(mk)
    if (svg) marker.setIcon(svg)
  }

  if (typeof marker.setOffset === 'function' && tv2.Point) {
    try {
      marker.setOffset(new tv2.Point(layout.anchorX, layout.anchorY))
    } catch {
      /* noop */
    }
  }
}

/** Marker 생성 옵션에 넣을 iconHTML (생성 시점 적용) */
export function markerConstructorIconOptions(
  mk: MapTmapMarker,
  iconHtml: string,
): { iconHTML: string } {
  const layout = getMarkerIconLayout(mk)
  const wrapped = `<div style="width:${layout.width}px;height:${layout.height}px;overflow:visible;pointer-events:none;line-height:0;">${iconHtml}</div>`
  return { iconHTML: wrapped }
}
