export const COOKING_TIME_MIN = 5
export const COOKING_TIME_MAX = 120
export const COOKING_TIME_STEP = 5

const STORAGE_PREFIX = 'owner_base_cooking_minutes_'

export function clampCookingMinutes(minutes: number): number {
  return Math.min(COOKING_TIME_MAX, Math.max(COOKING_TIME_MIN, Math.round(minutes)))
}

/** 매장 기본 조리·픽업 시간 + 주문별 가감(분) */
export function resolvePickupMinutes(baseMinutes: number, adjustMinutes = 0): number {
  return clampCookingMinutes(baseMinutes + adjustMinutes)
}

export function readStoredBaseCookingMinutes(storeId: number): number | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${storeId}`)
    if (raw == null || raw === '') return null
    const n = Number(raw)
    return Number.isFinite(n) ? clampCookingMinutes(n) : null
  } catch {
    return null
  }
}

export function writeStoredBaseCookingMinutes(storeId: number, minutes: number): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${storeId}`, String(clampCookingMinutes(minutes)))
  } catch {
    /* ignore */
  }
}

export function formatPickupMinutes(minutes: number): string {
  return `${minutes}분`
}

export function isPickupTimeLocked(order: { acceptedAtMs?: number }): boolean {
  return order.acceptedAtMs != null
}

/** 조리 시작 전 — 픽업 예상 시간만 표시 */
export function formatPickupPreviewLabel(pickupMinutes: number): string {
  return `픽업 예상 · ${formatPickupMinutes(pickupMinutes)}`
}

/** 조리 시작 시각 기준 픽업 예정 시각 라벨 (확정) */
export function formatPickupEtaLabel(acceptedAtMs: number | undefined, pickupMinutes: number): string {
  if (!acceptedAtMs) {
    return formatPickupPreviewLabel(pickupMinutes)
  }
  const eta = new Date(acceptedAtMs + pickupMinutes * 60_000)
  const h = eta.getHours()
  const m = eta.getMinutes()
  const ap = h < 12 ? '오전' : '오후'
  const h12 = h % 12 || 12
  const mm = String(m).padStart(2, '0')
  return `픽업 ${ap} ${h12}:${mm} (${formatPickupMinutes(pickupMinutes)})`
}
