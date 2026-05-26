/**
 * 백엔드 연동 on/off
 * - 기본값: 구현된 API는 연동 ON (env 로 `=false` 시에만 끔)
 * - 랭킹 API 미구현 → 기본 OFF
 */
function enabled(name: string, defaultOn: boolean): boolean {
  const v = (import.meta.env[name] as string | undefined)?.trim().toLowerCase()
  if (v === 'false' || v === '0') return false
  if (v === 'true' || v === '1') return true
  return defaultOn
}

export const LIVE_API = {
  ranking: enabled('VITE_LIVE_API_RANKING', false),
  notifications: enabled('VITE_LIVE_API_NOTIFICATIONS', true),
  sortedStores: enabled('VITE_LIVE_API_SORTED_STORES', true),
} as const
