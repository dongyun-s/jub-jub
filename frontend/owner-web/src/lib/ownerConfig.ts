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
 * true: lib/mocks 예시 데이터 사용 (기본값)
 * false: 실 API 연동 (VITE_OWNER_USE_MOCK=false)
 */
export function useOwnerMockData(): boolean {
  const raw = (import.meta.env.VITE_OWNER_USE_MOCK as string | undefined)?.trim().toLowerCase()
  if (raw === 'false' || raw === '0') return false
  return true
}

/**
 * 사장님 로그인 가드 스킵 (auth 연동 전 개발용)
 * - 기본 true → 토큰 없이 POS 진입
 * - VITE_OWNER_SKIP_AUTH=false 이면 로그인 필수
 */
export function isOwnerAuthSkipped(): boolean {
  const raw = (import.meta.env.VITE_OWNER_SKIP_AUTH as string | undefined)?.trim().toLowerCase()
  if (raw === 'false' || raw === '0') return false
  return true
}
