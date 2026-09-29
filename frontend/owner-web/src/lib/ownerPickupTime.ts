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

/** 수락 전 조절한 분 기준 — 지금 + N분 HH:mm 미리보기 */
export function formatAdjustedPickupPreview(pickupMinutes: number): string {
  const mins = clampCookingMinutes(pickupMinutes)
  const eta = new Date(Date.now() + mins * 60_000)
  const hhmm = eta.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `예상 픽업 ${hhmm} (약 ${mins}분)`
}

/** 조리 시작 시각 기준 픽업 예정 시각 라벨 (확정) */
export function formatPickupEtaLabel(acceptedAtMs: number | undefined, pickupMinutes: number): string {
  if (!acceptedAtMs) {
    return formatPickupPreviewLabel(pickupMinutes)
  }
  const eta = new Date(acceptedAtMs + pickupMinutes * 60_000)
  return `픽업 ${formatClockLabel(eta)} · ${formatPickupMinutes(pickupMinutes)}`
}

function formatClockLabel(d: Date): string {
  const h = d.getHours()
  const m = d.getMinutes()
  const ap = h < 12 ? '오전' : '오후'
  const h12 = h % 12 || 12
  const mm = String(m).padStart(2, '0')
  return `${ap} ${h12}:${mm}`
}

/** ISO → HH:mm (24h). 파싱 실패 시 null */
export function formatPickupHhMm(iso?: string | null): string | null {
  if (!iso?.trim()) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

/** 서버 estimatedPickupTime(ISO) 우선 표시 — 없으면 로컬 계산(매장 기본 조리시간 폴백) */
export function formatPickupEtaDisplay(
  estimatedPickupTime: string | null | undefined,
  acceptedAtMs: number | undefined,
  pickupMinutes: number,
): string {
  if (estimatedPickupTime?.trim()) {
    const d = new Date(estimatedPickupTime)
    if (!Number.isNaN(d.getTime())) {
      const hhmm = formatPickupHhMm(estimatedPickupTime)
      // 카드 폭이 좁아 한 줄로 유지 (겹침 방지)
      return hhmm
        ? `픽업 ${hhmm} · ${formatPickupMinutes(pickupMinutes)}`
        : `픽업 ${formatClockLabel(d)} · ${formatPickupMinutes(pickupMinutes)}`
    }
  }
  return formatPickupEtaLabel(acceptedAtMs, pickupMinutes)
}

/** 신규(수락 전) 카드·모달 — 서버 예측 HH:mm 있으면 우선, 없으면 기본 조리시간 */
export function formatNewOrderPickupLabel(
  estimatedPickupTime: string | null | undefined,
  pickupMinutes: number,
): string {
  const hhmm = formatPickupHhMm(estimatedPickupTime)
  if (hhmm) return `예상 픽업 ${hhmm} (약 ${pickupMinutes}분)`
  return formatPickupPreviewLabel(pickupMinutes)
}

/**
 * 동일 매장(오너 POS) 신규 큐에서 이 주문보다 앞에 있는 대기 건수.
 * 결제·주문 id 오름차순 = 먼저 들어온 주문이 앞.
 */
export function countWaitingOrdersAhead(orderId: number, newOrders: { orderId: number }[]): number {
  const sorted = [...newOrders].sort((a, b) => a.orderId - b.orderId)
  const idx = sorted.findIndex((o) => o.orderId === orderId)
  return idx > 0 ? idx : 0
}

export function formatWaitingQueueHint(waitingAhead: number): string | null {
  if (waitingAhead <= 0) return null
  return `동일 매장 대기 주문 ${waitingAhead}건 반영`
}
