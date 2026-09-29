/** 서버 estimatedPickupTime(ISO) → 고객 UI용 HH:mm (24h) */
export function formatPickupHhMm(iso?: string | null): string | null {
  if (!iso?.trim()) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatPickupEtaBadge(iso?: string | null): string {
  const hhmm = formatPickupHhMm(iso)
  return hhmm ? `픽업 ${hhmm} 예정` : '픽업 예정 확인 중'
}

export function formatPickupEtaSentence(iso?: string | null, suffix = ''): string {
  const hhmm = formatPickupHhMm(iso)
  if (!hhmm) return '예상 픽업 시각을 확인하는 중이에요.'
  return `픽업 예정 ${hhmm}${suffix}`
}

/** 매장 기본 조리시간 → 지금 기준 예상 픽업 HH:mm */
export function estimatePickupHhMmFromMinutes(
  cookingTimeMinutes: number,
  from: Date = new Date(),
): string | null {
  const mins = Math.max(1, Math.round(Number(cookingTimeMinutes)) || 15)
  return formatPickupHhMm(new Date(from.getTime() + mins * 60_000).toISOString())
}

/** 식당 카드·목록용 — 예: 예상 픽업 14:35 (약 15분) */
export function formatStoreCardPickupLabel(cookingTimeMinutes: number): string {
  const mins = Math.max(1, Math.round(Number(cookingTimeMinutes)) || 15)
  const hhmm = estimatePickupHhMmFromMinutes(mins)
  return hhmm ? `예상 픽업 ${hhmm} (약 ${mins}분)` : `픽업 약 ${mins}분`
}

/** 출발 추천 API — 메인 문구 */
export function formatDepartureTitle(rec: {
  leaveNow: boolean
  minutesUntilDeparture: number
}): string {
  if (rec.leaveNow) return '지금 출발하세요'
  const m = Math.max(0, Math.round(Number(rec.minutesUntilDeparture)) || 0)
  if (m <= 0) return '지금 출발하세요'
  return `${m}분 후 출발하세요`
}

/** 출발 추천 API — 보조 문구 */
export function formatDepartureDetail(rec: {
  walkingMinutes: number
  estimatedPickupTime?: string | null
  expectedArrivalAt?: string | null
}): string {
  const walk = Math.max(0, Math.round(Number(rec.walkingMinutes)) || 0)
  const parts: string[] = []
  if (walk > 0) parts.push(`도보 약 ${walk}분`)
  const pickupHh = formatPickupHhMm(rec.estimatedPickupTime)
  if (pickupHh) parts.push(`픽업 ${pickupHh} 예정`)
  const arriveHh = formatPickupHhMm(rec.expectedArrivalAt)
  if (arriveHh && arriveHh !== pickupHh) parts.push(`도착 예상 ${arriveHh}`)
  return parts.join(' · ') || '위치·픽업 시각을 확인하는 중이에요.'
}

/** 홈 배너 등 한 줄 요약 */
export function formatDepartureBannerLine(rec: {
  leaveNow: boolean
  minutesUntilDeparture: number
  estimatedPickupTime?: string | null
}): string {
  const hhmm = formatPickupHhMm(rec.estimatedPickupTime)
  const pickup = hhmm ? `픽업 ${hhmm}` : '픽업 예정'
  if (rec.leaveNow) return `지금 출발 · ${pickup}`
  const m = Math.max(0, Math.round(Number(rec.minutesUntilDeparture)) || 0)
  if (m <= 0) return `지금 출발 · ${pickup}`
  return `${m}분 후 출발 · ${pickup}`
}
