export type SalesPauseState = {
  paused: boolean
  /** 일시 중지 종료 시각(ms). 무기한 중지면 null */
  untilMs: number | null
}

const storageKey = (storeId: number) => `owner_sales_pause_${storeId}`

function normalize(raw: SalesPauseState): SalesPauseState {
  if (!raw.paused) return { paused: false, untilMs: null }
  if (raw.untilMs != null && raw.untilMs <= Date.now()) {
    return { paused: false, untilMs: null }
  }
  return raw
}

export function readSalesPause(storeId: number): SalesPauseState {
  try {
    const legacyKey = `owner_sales_paused_${storeId}`
    const legacy = localStorage.getItem(legacyKey)
    if (legacy === '1') return { paused: true, untilMs: null }
    if (legacy === '0') return { paused: false, untilMs: null }

    const raw = localStorage.getItem(storageKey(storeId))
    if (!raw) return { paused: false, untilMs: null }
    return normalize(JSON.parse(raw) as SalesPauseState)
  } catch {
    return { paused: false, untilMs: null }
  }
}

export function writeSalesPause(storeId: number, state: SalesPauseState): void {
  try {
    const next = normalize(state)
    localStorage.setItem(storageKey(storeId), JSON.stringify(next))
    localStorage.setItem(`owner_sales_paused_${storeId}`, next.paused ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export function formatPauseResumeAt(untilMs: number): string {
  return new Date(untilMs).toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function getPauseRemainingMinutes(untilMs: number, now = Date.now()): number {
  return Math.max(0, Math.ceil((untilMs - now) / 60_000))
}

/** 짧은 표기: "42분 남음" */
export function formatPauseRemainingMinutes(untilMs: number, now = Date.now()): string {
  const totalMins = getPauseRemainingMinutes(untilMs, now)
  if (totalMins <= 0) return '곧 재개'
  if (totalMins < 60) return `${totalMins}분 남음`
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  if (m === 0) return `${h}시간 남음`
  return `${h}시간 ${m}분 남음`
}

export function formatPauseRemaining(untilMs: number, now = Date.now()): string {
  const totalMins = getPauseRemainingMinutes(untilMs, now)
  if (totalMins <= 0) return '곧 자동 재개'
  if (totalMins < 60) return `${totalMins}분 후 자동 재개`
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  if (m === 0) return `${h}시간 후 자동 재개`
  return `${h}시간 ${m}분 후 자동 재개`
}

/** @deprecated readSalesPause 사용 */
export function readSalesPaused(storeId: number): boolean {
  return readSalesPause(storeId).paused
}

/** @deprecated writeSalesPause 사용 */
export function writeSalesPaused(storeId: number, paused: boolean): void {
  writeSalesPause(storeId, paused ? { paused: true, untilMs: null } : { paused: false, untilMs: null })
}
