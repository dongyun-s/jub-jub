/**
 * 출석 랜덤박스 (백엔드: 누적 출석 7회마다 issueAttendanceRandomBox)
 * - API는 당첨 결과를 내려주지 않으므로 쿠폰함 diff로 판별
 */
import { fetchAttendanceHistory, fetchMyCoupons } from '../api/rewards'

export type AttendanceBoxPrize = '1000' | '100' | 'NONE'

/** 백엔드 countByMemberProfile 과 맞추기 위해 서버 출석 날짜를 합산(중복 일자 제거) */
export async function countServerLifetimeAttendance(): Promise<number> {
  const year = new Date().getFullYear()
  const years = [year, year - 1]
  const dates = new Set<string>()

  await Promise.all(
    years.flatMap((y) =>
      Array.from({ length: 12 }, (_, i) => {
        const month = i + 1
        return fetchAttendanceHistory({ year: y, month })
          .then((res) => {
            for (const d of res.attendedDates) dates.add(d)
          })
          .catch(() => {
            /* 월별 조회 실패는 무시 */
          })
      }),
    ),
  )

  return dates.size
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
  return '꽝'
}
