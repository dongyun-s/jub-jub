import { getActiveStoreId } from './ownerSession'

/**
 * 사장님 앱에서 관리할 매장 PK
 * 1) 로그인 세션에 바인딩된 storeId
 * 2) frontend/.env 의 VITE_OWNER_STORE_ID
 * 3) 기본 1
 */
export function getOwnerStoreId(): number {
  const active = getActiveStoreId()
  if (active != null) return active

  const raw = (import.meta.env.VITE_OWNER_STORE_ID as string | undefined)?.trim()
  const n = raw ? Number(raw) : 1
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1
}

/**
 * true: lib/mocks 예시 데이터
 * false: 실 API (기본) — VITE_OWNER_USE_MOCK=true 일 때만 목
 */
export function useOwnerMockData(): boolean {
  const raw = (import.meta.env.VITE_OWNER_USE_MOCK as string | undefined)?.trim().toLowerCase()
  if (raw === 'true' || raw === '1') return true
  return false
}

/**
 * 사장님 로그인 가드 스킵 (로컬 UI만 볼 때)
 * - 기본 false → 로그인 필수
 * - VITE_OWNER_SKIP_AUTH=true 이면 토큰 없이 POS 진입
 */
export function isOwnerAuthSkipped(): boolean {
  const raw = (import.meta.env.VITE_OWNER_SKIP_AUTH as string | undefined)?.trim().toLowerCase()
  return raw === 'true' || raw === '1'
}
