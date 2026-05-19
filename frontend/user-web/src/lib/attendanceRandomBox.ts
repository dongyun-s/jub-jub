/**
 * 출석 랜덤박스 (백엔드: 누적 출석 7회마다 issueAttendanceRandomBox)
 * - API는 당첨 결과를 내려주지 않으므로 쿠폰함 diff로 판별
 */
import { fetchAttendanceHistory, fetchMyCoupons } from '../api/rewards'

export type AttendanceBoxPrize = '1000' | '100' | 'NONE'

const LIFETIME_CACHE_MS = 10 * 60 * 1000
const MONTH_FETCH_CONCURRENCY = 2

let lifetimeCache: { count: number; cachedAt: number } | null = null
let lifetimeInflight: Promise<number> | null = null

export function invalidateLifetimeAttendanceCache(): void {
  lifetimeCache = null
  lifetimeInflight = null
}

function monthTasksForLifetimeCount(): { year: number; month: number }[] {
  const now = new Date()
  const year = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const tasks: { year: number; month: number }[] = []
  for (const y of [year, year - 1]) {
    const lastMonth = y === year ? currentMonth : 12
    for (let month = 1; month <= lastMonth; month++) {
      tasks.push({ year: y, month })
    }
  }
  return tasks
}

/**
 * 누적 출석 일수(서로 다른 날짜 기준).
 * 과거: 24개월 동시 요청 → ngrok/서버 과부하·401 연쇄 가능.
 * 현재: 캐시 + in-flight 공유 + 소량 동시(2)만 허용.
 */
export async function countServerLifetimeAttendance(force = false): Promise<number> {
  if (!force && lifetimeCache && Date.now() - lifetimeCache.cachedAt < LIFETIME_CACHE_MS) {
    return lifetimeCache.count
  }
  if (lifetimeInflight) {
    return lifetimeInflight
  }

  lifetimeInflight = (async () => {
    const dates = new Set<string>()
    const tasks = monthTasksForLifetimeCount()

    for (let i = 0; i < tasks.length; i += MONTH_FETCH_CONCURRENCY) {
      const batch = tasks.slice(i, i + MONTH_FETCH_CONCURRENCY)
      await Promise.all(
        batch.map(async ({ year, month }) => {
          try {
            const res = await fetchAttendanceHistory({ year, month })
            for (const d of res.attendedDates) dates.add(d)
          } catch {
            /* 월별 조회 실패는 무시 */
          }
        }),
      )
    }

    const count = dates.size
    lifetimeCache = { count, cachedAt: Date.now() }
    return count
  })().finally(() => {
    lifetimeInflight = null
  })

  return lifetimeInflight
}

/** 백엔드 AttendanceService: totalAttendanceCount % 7 == 0 */
export function isAttendanceRandomBoxMilestone(totalCount: number): boolean {
  return totalCount > 0 && totalCount % 7 === 0
}

export function attendanceUntilNextRandomBox(totalCount: number): number {
  if (totalCount <= 0) return 7
  const rem = totalCount % 7
  return rem === 0 ? 7 : 7 - rem
}

/** 출석 POST 직후 새로 생긴 쿠폰으로 당첨 판별 */
export async function resolveAttendanceBoxPrizeFromCoupons(
  couponIdsBefore: Set<number>,
): Promise<AttendanceBoxPrize> {
  const coupons = await fetchMyCoupons()
  const fresh = coupons.filter((c) => !couponIdsBefore.has(c.memberCouponId))
  if (fresh.some((c) => c.discountAmount >= 1000)) return '1000'
  if (fresh.some((c) => c.discountAmount >= 100)) return '100'
  return 'NONE'
}

export function prizeLabel(prize: AttendanceBoxPrize): string {
  if (prize === '1000') return '1,000원 쿠폰'
  if (prize === '100') return '100원 쿠폰'
  return '꽁'
}
