/** 오늘 출석 완료 여부를 마이페이지·홈에서 동일하게 쓰기 위한 로컬 스토리지 */

import { getSessionEmail } from './authStorage'

export function isoDateLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 월요일 시작 현재 주의 로컬 YYYY-MM-DD 7개 (마이페이지 주간 그리드 인덱스 0 = 월) */
export function weekIsoDatesMondayFirst(ref: Date = new Date()): string[] {
  const d = new Date(ref)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const mondayOffset = (day + 6) % 7
  d.setDate(d.getDate() - mondayOffset)
  const out: string[] = []
  for (let i = 0; i < 7; i++) {
    const x = new Date(d)
    x.setDate(d.getDate() + i)
    out.push(isoDateLocal(x))
  }
  return out
}

/**
 * 로그인 직후 호출: 이번 주(월~일) anon 출석 키를 계정 이메일 키로 옮김.
 * 예전에 비로그인·프로필 로드 전에 출석만 했을 때 마이페이지 주간 칸에 보이게 함.
 */
/**
 * 로그인 직후: 이번 주 anon 출석만 해당 이메일로 옮김.
 * 이미 그 이메일 키가 있으면 덮어쓰지 않음(다른 계정 잔여 anon이 새 가입 계정으로 넘어가는 것 방지).
 */
export function migrateWeeklyAnonAttendanceToEmail(primaryEmail: string): void {
  if (typeof window === 'undefined') return
  const email = primaryEmail.trim()
  if (!email) return
  for (const date of weekIsoDatesMondayFirst()) {
    const anonKey = `jubjub_attendance_anon_${date}`
    if (window.localStorage.getItem(anonKey) !== '1') continue
    const primaryKey = `jubjub_attendance_${email}_${date}`
    if (window.localStorage.getItem(primaryKey) === '1') {
      window.localStorage.removeItem(anonKey)
      continue
    }
    window.localStorage.setItem(primaryKey, '1')
    window.localStorage.removeItem(anonKey)
  }
}

/** 로컬 일별 키 `jubjub_attendance_{이메일}_{날짜}` 로 주간 표시 */
export function getWeekAttendanceCheckedLocally(profileEmail?: string | null): boolean[] {
  if (typeof window === 'undefined') return Array(7).fill(false)
  const id = attendancePrimaryId(profileEmail)
  const dates = weekIsoDatesMondayFirst()
  return dates.map((date) => {
    const primary = `jubjub_attendance_${id}_${date}`
    if (window.localStorage.getItem(primary) === '1') return true
    if (id === 'anon' && window.localStorage.getItem(`jubjub_attendance_anon_${date}`) === '1') return true
    return false
  })
}

/** 프로필 이메일이 아직 없을 때는 로그인 시 저장한 세션 이메일 사용 */
export function attendancePrimaryId(profileEmail: string | undefined | null): string {
  const fromProfile = profileEmail?.trim()
  if (fromProfile) return fromProfile
  const fromSession = getSessionEmail()?.trim()
  if (fromSession) return fromSession
  return 'anon'
}

export function attendanceStorageKey(profileEmail?: string | null): string {
  const id = attendancePrimaryId(profileEmail)
  return `jubjub_attendance_${id}_${isoDateLocal(new Date())}`
}

/** 로컬 출석 표시 제거 (서버에 없을 때 잘못된 완료 UI 방지) */
export function clearLocalAttendanceMark(profileEmail: string | undefined | null, date?: string): void {
  if (typeof window === 'undefined') return
  const d = date ?? isoDateLocal(new Date())
  const id = attendancePrimaryId(profileEmail)
  window.localStorage.removeItem(`jubjub_attendance_${id}_${d}`)
  if (id !== 'anon') {
    window.localStorage.removeItem(`jubjub_attendance_anon_${d}`)
  }
}

/**
 * 로그인 계정: 해당 이메일 키만 본다.
 * 비로그인(anon)일 때만 anon 키를 본다 — 다른 계정에 브라우저 캐시가 섞이지 않게.
 */
export function isAttendanceMarkedDone(profileEmail?: string | null): boolean {
  if (typeof window === 'undefined') return false
  const date = isoDateLocal(new Date())
  const id = attendancePrimaryId(profileEmail)
  const primary = `jubjub_attendance_${id}_${date}`
  if (window.localStorage.getItem(primary) === '1') return true
  if (id === 'anon') {
    return window.localStorage.getItem(`jubjub_attendance_anon_${date}`) === '1'
  }
  return false
}

export function markAttendanceDone(profileEmail?: string | null): void {
  if (typeof window === 'undefined') return
  const date = isoDateLocal(new Date())
  const id = attendancePrimaryId(profileEmail)
  window.localStorage.setItem(`jubjub_attendance_${id}_${date}`, '1')
  if (id !== 'anon') {
    window.localStorage.removeItem(`jubjub_attendance_anon_${date}`)
  }
  refreshAttendanceStreakAfterMarked(profileEmail)
}

type StreakState = { lastAttendedDate: string; currentStreak: number }

const STREAK_PREFIX = 'jubjub_attendance_streak'

function streakStorageKey(profileEmail?: string | null): string {
  return `${STREAK_PREFIX}_${attendancePrimaryId(profileEmail)}`
}

/** 현지 자정 기준으로 며칠 더한 날짜(YYYY-MM-DD) */
function ymdAddDays(delta: number): string {
  const n = new Date()
  n.setHours(0, 0, 0, 0)
  n.setDate(n.getDate() + delta)
  return isoDateLocal(n)
}

function ymdAddDaysFrom(refYmd: string, delta: number): string {
  const parts = refYmd.trim().split('-')
  if (parts.length !== 3) return refYmd
  const y = Number(parts[0])
  const m = Number(parts[1]) - 1
  const d = Number(parts[2])
  const dt = new Date(y, m, d)
  if (Number.isNaN(dt.getTime())) return refYmd
  dt.setHours(0, 0, 0, 0)
  dt.setDate(dt.getDate() + delta)
  return isoDateLocal(dt)
}

/**
 * 서버 history(attendedDates) 기준 "연속 출석" 계산.
 * - 오늘이 미출석이어도 "어제까지 연속"이면 그 값 유지 (UI에서 '연속 N일' 표시용)
 * - 주간(월~일)과 무관한 rolling streak
 */
export function computeRollingAttendanceStreakFromDates(attendedDates: string[]): {
  streak: number
  lastAttendedDate: string | null
} {
  const set = new Set(attendedDates.map((s) => s.trim()).filter(Boolean))
  const today = isoDateLocal(new Date())
  const yesterday = ymdAddDays(-1)

  const start = set.has(today) ? today : set.has(yesterday) ? yesterday : null
  if (!start) return { streak: 0, lastAttendedDate: null }

  let streak = 0
  let cur = start
  while (set.has(cur)) {
    streak += 1
    cur = ymdAddDaysFrom(cur, -1)
    if (streak > 3660) break
  }
  return { streak, lastAttendedDate: start }
}

/**
 * 서버 history 기반으로 로컬 streak 상태 동기화 (새 기기/새로고침에서도 연속 출석 유지)
 */
export function syncAttendanceStreakFromServer(
  profileEmail: string | undefined | null,
  attendedDates: string[],
): void {
  if (typeof window === 'undefined') return
  const { streak, lastAttendedDate } = computeRollingAttendanceStreakFromDates(attendedDates)
  const key = streakStorageKey(profileEmail)
  if (!lastAttendedDate || streak <= 0) {
    window.localStorage.removeItem(key)
    return
  }
  window.localStorage.setItem(
    key,
    JSON.stringify({ lastAttendedDate, currentStreak: streak } as StreakState),
  )
}

/**
 * 오늘 출석이 로컬에 반영된 뒤 호출.
 * 어제까지의 연속 기록이 있으면 +1, 아니면 1일부터 다시.
 */
export function refreshAttendanceStreakAfterMarked(profileEmail?: string | null): void {
  if (typeof window === 'undefined') return
  if (!isAttendanceMarkedDone(profileEmail)) return

  const today = isoDateLocal(new Date())
  const yesterday = ymdAddDays(-1)
  const key = streakStorageKey(profileEmail)
  let nextStreak = 1

  const raw = window.localStorage.getItem(key)
  if (raw) {
    try {
      const s = JSON.parse(raw) as StreakState
      if (s.lastAttendedDate === today) {
        window.dispatchEvent(new Event('jubjub-attendance-local'))
        return
      }
      if (s.lastAttendedDate === yesterday) {
        nextStreak = Math.max(1, s.currentStreak) + 1
      }
    } catch {
      nextStreak = 1
    }
  }

  window.localStorage.setItem(
    key,
    JSON.stringify({ lastAttendedDate: today, currentStreak: nextStreak } as StreakState),
  )
  window.dispatchEvent(new Event('jubjub-attendance-local'))
}

/**
 * 화면용 현재 연속 출석 일수.
 * - 오늘 출석 완료: 저장된 streak
 * - 어제까지 출석했고 오늘 미출석: 아직 연속 유지로 같은 숫자
 * - 그보다 오래 끊기면 0
 */
export function getAttendanceStreak(profileEmail?: string | null): number {
  if (typeof window === 'undefined') return 0
  const today = isoDateLocal(new Date())
  const yesterday = ymdAddDays(-1)
  const key = streakStorageKey(profileEmail)
  const raw = window.localStorage.getItem(key)

  if (!raw) {
    return isAttendanceMarkedDone(profileEmail) ? 1 : 0
  }

  try {
    const s = JSON.parse(raw) as StreakState
    if (s.lastAttendedDate === today) {
      return Math.max(1, s.currentStreak)
    }
    if (s.lastAttendedDate === yesterday) {
      return Math.max(1, s.currentStreak)
    }
    return 0
  } catch {
    return isAttendanceMarkedDone(profileEmail) ? 1 : 0
  }
}
