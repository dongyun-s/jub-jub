/**
 * 리워드 도메인 API — Base: /api/v1/rewards (JWT 필요)
 * 명세: 리워드 도메인 API 명세서 v1 (결제 파트 제외)
 *
 * 일부 서버는 ApiResponse 래핑({ success, data }) 없이 DTO만 반환하므로
 * plain 파싱 + 래핑 해제 + 필드명 보정을 한다.
 */
import { apiV1FetchPlain, ApiError } from './authClient'
import { weekIsoDatesMondayFirst } from '../lib/rewardAttendance'

function unwrapApiEnvelope(body: unknown): unknown {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return body
  const o = body as Record<string, unknown>
  if ('success' in o && typeof o.success === 'boolean') {
    if (!o.success) {
      const err = o.error as Record<string, unknown> | null | undefined
      const msg =
        err && typeof err.message === 'string'
          ? err.message
          : '요청을 처리하지 못했습니다.'
      throw new ApiError(msg, { status: 400 })
    }
    return Object.prototype.hasOwnProperty.call(o, 'data') ? o.data : body
  }
  return body
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (!Number.isNaN(n)) return n
  }
  return fallback
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function normalizeRewardMePayload(payload: unknown): RewardMeResponse {
  if (typeof payload !== 'object' || payload === null) {
    throw new ApiError('리워드 정보 형식이 올바르지 않습니다.', { status: 200 })
  }
  const p = payload as Record<string, unknown>
  return {
    cumulativeXp: num(p.cumulativeXp ?? p.cumulative_xp),
    nextTierRequiredCount: num(p.nextTierRequiredCount ?? p.next_tier_required_count),
    nickname: str(p.nickname),
    orderCount: num(p.orderCount ?? p.order_count),
    tier: str(p.tier),
    tierName: str(p.tierName ?? p.tier_name),
    totalWalkingDistance: num(p.totalWalkingDistance ?? p.total_walking_distance),
  }
}

function normalizeCouponPayload(raw: unknown): MemberCouponDto {
  if (typeof raw !== 'object' || raw === null) {
    throw new ApiError('쿠폰 정보 형식이 올바르지 않습니다.', { status: 200 })
  }
  const p = raw as Record<string, unknown>
  return {
    memberCouponId: num(p.memberCouponId ?? p.member_coupon_id),
    name: str(p.name),
    discountAmount: num(p.discountAmount ?? p.discount_amount),
    minOrderAmount: num(p.minOrderAmount ?? p.min_order_amount),
    expiredAt: str(p.expiredAt ?? p.expired_at),
  }
}

function normalizeCalculatePayload(payload: unknown): RewardCalculateResponse {
  if (typeof payload !== 'object' || payload === null) {
    throw new ApiError('할인 계산 응답 형식이 올바르지 않습니다.', { status: 200 })
  }
  const p = payload as Record<string, unknown>
  return {
    originalAmount: num(p.originalAmount ?? p.original_amount),
    tierDiscountAmount: num(p.tierDiscountAmount ?? p.tier_discount_amount),
    couponDiscountAmount: num(p.couponDiscountAmount ?? p.coupon_discount_amount),
    finalPaymentAmount: num(p.finalPaymentAmount ?? p.final_payment_amount),
  }
}

/** GET /api/v1/rewards/me */
export interface RewardMeResponse {
  cumulativeXp: number
  nextTierRequiredCount: number
  nickname: string
  orderCount: number
  tier: string
  tierName: string
  totalWalkingDistance: number
}

/** GET /api/v1/rewards/coupons 항목 */
export interface MemberCouponDto {
  memberCouponId: number
  name: string
  discountAmount: number
  minOrderAmount: number
  expiredAt: string
}

/** POST /api/v1/rewards/calculate 요청 */
export interface RewardCalculateRequest {
  originalOrderAmount: number
  memberCouponIds?: number[] | null
}

/** POST /api/v1/rewards/calculate 응답 */
export interface RewardCalculateResponse {
  originalAmount: number
  tierDiscountAmount: number
  couponDiscountAmount: number
  finalPaymentAmount: number
}

export async function fetchRewardMe(): Promise<RewardMeResponse> {
  const raw = await apiV1FetchPlain<unknown>('/rewards/me')
  const inner = unwrapApiEnvelope(raw)
  return normalizeRewardMePayload(inner)
}

export async function fetchMyCoupons(): Promise<MemberCouponDto[]> {
  const raw = await apiV1FetchPlain<unknown>('/rewards/coupons')
  const inner = unwrapApiEnvelope(raw)
  if (!Array.isArray(inner)) {
    throw new ApiError('쿠폰 목록 형식이 올바르지 않습니다.', { status: 200 })
  }
  return inner.map(normalizeCouponPayload)
}

/** 월~일 7칸 — 서버 미구현 시 null */
function parseAttendanceWeekPayload(inner: unknown): boolean[] | null {
  const datesThisWeek = weekIsoDatesMondayFirst()

  if (inner == null) return null

  if (Array.isArray(inner)) {
    if (inner.length === 7 && inner.every((x) => typeof x === 'boolean')) {
      return inner as boolean[]
    }
    if (inner.length > 0 && inner.every((x) => typeof x === 'string')) {
      const set = new Set(inner as string[])
      return datesThisWeek.map((d) => set.has(d))
    }
    return null
  }

  if (typeof inner === 'object') {
    const o = inner as Record<string, unknown>
    const arrCand = [
      o.days,
      o.week,
      o.attendanceWeek,
      o.attendance_week,
      o.checkedDays,
      o.checked_days,
    ].find((v) => Array.isArray(v) && (v as unknown[]).length === 7) as unknown[] | undefined
    if (arrCand) {
      return arrCand.map((x) => x === true || x === 'true' || x === 1 || x === '1')
    }
    const dateCand = [
      o.attendedDates,
      o.attended_dates,
      o.dates,
      o.attendanceDates,
      o.attendance_dates,
    ].find((v) => Array.isArray(v)) as unknown[] | undefined
    if (dateCand?.every((x) => typeof x === 'string')) {
      const set = new Set(dateCand as string[])
      return datesThisWeek.map((d) => set.has(d))
    }
  }

  return null
}

/** GET /api/v1/rewards/attendance/week — 미구현 시 null */
export async function fetchAttendanceWeek(): Promise<boolean[] | null> {
  try {
    const raw = await apiV1FetchPlain<unknown>('/rewards/attendance/week')
    const inner = unwrapApiEnvelope(raw)
    return parseAttendanceWeekPayload(inner)
  } catch {
    return null
  }
}

export interface AttendanceHistoryResponse {
  totalAttendanceCount: number
  attendedDates: string[]
}

function normalizeAttendanceHistoryPayload(inner: unknown): AttendanceHistoryResponse {
  if (typeof inner !== 'object' || inner === null || Array.isArray(inner)) {
    throw new ApiError('출석 내역 응답 형식이 올바르지 않습니다.', { status: 200 })
  }
  const o = inner as Record<string, unknown>
  const totalAttendanceCount = num(o.totalAttendanceCount ?? o.total_attendance_count, 0)
  const rawDates = o.attendedDates ?? o.attended_dates
  const attendedDates =
    Array.isArray(rawDates) && rawDates.every((x) => typeof x === 'string')
      ? (rawDates as string[])
      : []
  return { totalAttendanceCount, attendedDates }
}

/** GET /api/v1/rewards/attendance/history?year=&month= */
export async function fetchAttendanceHistory(params?: {
  year?: number
  month?: number
}): Promise<AttendanceHistoryResponse> {
  const q = new URLSearchParams()
  if (params?.year != null) q.set('year', String(params.year))
  if (params?.month != null) q.set('month', String(params.month))
  const url = q.toString()
    ? `/rewards/attendance/history?${q.toString()}`
    : '/rewards/attendance/history'
  const raw = await apiV1FetchPlain<unknown>(url)
  const inner = unwrapApiEnvelope(raw)
  return normalizeAttendanceHistoryPayload(inner)
}

export async function postAttendanceCheck(): Promise<string> {
  const raw = await apiV1FetchPlain<unknown>('/rewards/attendance', { method: 'POST' })
  const inner = unwrapApiEnvelope(raw)
  if (typeof inner === 'string') return inner
  if (typeof inner === 'object' && inner !== null && typeof (inner as Record<string, unknown>).message === 'string') {
    return String((inner as Record<string, unknown>).message)
  }
  return '출석체크가 완료되었습니다.'
}

export async function calculateRewardDiscount(
  body: RewardCalculateRequest,
): Promise<RewardCalculateResponse> {
  const raw = await apiV1FetchPlain<unknown>('/rewards/calculate', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  const inner = unwrapApiEnvelope(raw)
  return normalizeCalculatePayload(inner)
}
