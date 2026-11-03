/** 쿠폰 만료일(YYYY-MM-DD) 기준 남은 기간·진행률 */

const MS_DAY = 86_400_000

function endOfDayFromYmd(ymd: string): number {
  const parts = ymd.trim().split(/[-/]/)
  if (parts.length >= 3) {
    const y = Number(parts[0])
    const m = Number(parts[1]) - 1
    const d = Number(parts[2])
    const t = new Date(y, m, d, 23, 59, 59, 999).getTime()
    if (!Number.isNaN(t)) return t
  }
  const t = Date.parse(ymd)
  return Number.isNaN(t) ? Date.now() : t
}

export type CouponExpiryUrgency = 'normal' | 'soon' | 'critical' | 'expired'

export type CouponExpiryProgress = {
  daysLeft: number
  percentRemaining: number
  urgency: CouponExpiryUrgency
  label: string
}

/** 유효기간을 만료일 포함 validDays일로 가정해 남은 비율 계산 */
export function computeCouponExpiryProgress(
  expiredAt: string,
  validDays = 30,
): CouponExpiryProgress {
  const endMs = endOfDayFromYmd(expiredAt)
  const startMs = endMs - validDays * MS_DAY
  const now = Date.now()
  const total = Math.max(1, endMs - startMs)
  const left = endMs - now
  const daysLeft = Math.ceil(left / MS_DAY)

  if (daysLeft <= 0) {
    return {
      daysLeft: 0,
      percentRemaining: 0,
      urgency: 'expired',
      label: '만료됨',
    }
  }

  const percentRemaining = Math.max(0, Math.min(100, (left / total) * 100))
  let urgency: CouponExpiryUrgency = 'normal'
  if (daysLeft <= 1) urgency = 'critical'
  else if (daysLeft <= 7) urgency = 'soon'

  const label = daysLeft === 1 ? '오늘 만료' : daysLeft <= 7 ? `D-${daysLeft}` : `${daysLeft}일 남음`

  return { daysLeft, percentRemaining, urgency, label }
}

export function isCouponExpiringSoon(expiredAt: string, withinDays = 7): boolean {
  const { daysLeft, urgency } = computeCouponExpiryProgress(expiredAt)
  return urgency !== 'expired' && daysLeft > 0 && daysLeft <= withinDays
}
