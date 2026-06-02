/** 사장님 앱에서 관리할 매장 ID — frontend/.env 의 VITE_OWNER_STORE_ID */
export function getOwnerStoreId(): number {
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
