/**
 * 출석 랜덤박스 — 명세 v1
 * - POST /rewards/attendance → isRandomBoxAvailable (7일 연속 출석)
 * - POST /rewards/random-box → WIN_1000 | WIN_100 | LOSE
 */
import type { RandomBoxApiResult } from '../api/rewards'
import { fetchAttendanceHistory, postRandomBoxOpen } from '../api/rewards'

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

/** 달력·통계용 누적 출석 일수 (랜덤박스 자격과는 별개) */
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
            /* ignore */
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

/** API result → UI prize */
export function mapRandomBoxApiResult(result: RandomBoxApiResult): AttendanceBoxPrize {
  if (result === 'WIN_1000') return '1000'
  if (result === 'WIN_100') return '100'
  return 'NONE'
}

/** 상자 선택 시 서버에서 확률 추첨 */
export async function openAttendanceRandomBox(): Promise<AttendanceBoxPrize> {
  const { result } = await postRandomBoxOpen()
  return mapRandomBoxApiResult(result)
}

/** 주간 그리드 기준 연속 출석 일수 (레거시·테스트용) */
export function consecutiveStreakFromWeek(checkedDays: boolean[]): number {
  const today = new Date().getDay()
  const todayIndex = today === 0 ? 6 : today - 1
  let streak = 0
  for (let i = todayIndex; i >= 0; i--) {
    if (!checkedDays[i]) break
    streak += 1
  }
  return streak
}

/**
 * rolling 연속 출석 일수 기준, 7일마다 랜덤박스 주기(요일 무관).
 * - filledInCycle: 이번 7일 주기에서 채운 칸 수(1~7), 0이면 아직 없음
 * - 다음 박스까지: filled이 7 미만이면 (7 - filled)일
 */
export function sevenDayRewardCycleProgress(consecutiveRollingDays: number): {
  filledInCycle: number
  daysUntilRandomBox: number
} {
  if (consecutiveRollingDays <= 0) {
    return { filledInCycle: 0, daysUntilRandomBox: 7 }
  }
  const filledInCycle = ((consecutiveRollingDays - 1) % 7) + 1
  const daysUntilRandomBox = filledInCycle >= 7 ? 0 : 7 - filledInCycle
  return { filledInCycle, daysUntilRandomBox }
}

/** UI·힌트용: rolling 연속 일수 → 랜덤박스까지 남은 일수 */
export function daysUntilRandomBoxStreak(consecutiveRollingDays: number): number {
  return sevenDayRewardCycleProgress(consecutiveRollingDays).daysUntilRandomBox
}

export function prizeLabel(prize: AttendanceBoxPrize): string {
  if (prize === '1000') return '1,000원 쿠폰'
  if (prize === '100') return '100원 쿠폰'
  return '꽝'
}
