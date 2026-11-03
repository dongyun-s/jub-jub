/**
 * 리워드 도메인 API — Base: /api/v1/rewards (JWT 필요)
 * 명세: 리워드 도메인 API 명세서 v1 (결제 파트 제외)
 *
 * 일부 서버는 ApiResponse 래핑({ success, data }) 없이 DTO만 반환하므로
 * plain 파싱 + 래핑 해제 + 필드명 보정을 한다.
 */
import { apiV1FetchPlain, ApiError } from './authClient'

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

/** Jackson enum 문자열·객체({ name })·기타 표기 흡수 */
function tierCode(v: unknown): string {
  if (typeof v === 'string' && v.trim()) return v.trim()
  if (typeof v === 'object' && v != null && !Array.isArray(v)) {
    const o = v as Record<string, unknown>
    if (typeof o.name === 'string' && o.name.trim()) return o.name.trim()
    if (typeof o.tier === 'string' && o.tier.trim()) return o.tier.trim()
  }
  return ''
}

function normalizeRewardMePayload(payload: unknown): RewardMeResponse {
  if (typeof payload !== 'object' || payload === null) {
    throw new ApiError('리워드 정보 형식이 올바르지 않습니다.', { status: 200 })
  }
  const p = payload as Record<string, unknown>
  return {
    nextTierRequiredCount: num(p.nextTierRequiredCount ?? p.next_tier_required_count),
    nickname: str(p.nickname),
    orderCount: num(p.orderCount ?? p.order_count),
    tier: tierCode(p.tier),
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
    isUsed: Boolean(p.isUsed ?? p.is_used),
    isExpired: Boolean(p.isExpired ?? p.is_expired),
    usedAt: p.usedAt != null || p.used_at != null ? str(p.usedAt ?? p.used_at) : null,
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
  isUsed: boolean
  isExpired: boolean
  usedAt: string | null
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

/** 픽업 완료 등으로 리워드 프로필이 바뀐 뒤 홈·마이페이지가 다시 조회하도록 */
export function notifyRewardsUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('jubjub-rewards-updated'))
}

export async function fetchMyCoupons(): Promise<MemberCouponDto[]> {
  const raw = await apiV1FetchPlain<unknown>('/rewards/coupons')
  const inner = unwrapApiEnvelope(raw)
  if (!Array.isArray(inner)) {
    throw new ApiError('쿠폰 목록 형식이 올바르지 않습니다.', { status: 200 })
  }
  return inner.map(normalizeCouponPayload)
}

/**
 * GET /api/v1/rewards/attendance/week
 * 백엔드 RewardController에 해당 엔드포인트가 없어 프록시까지 500이 찍힌다.
 * 주간 7칸은 MyPage에서 attendance/history + 로컬 출석만으로 맞춘다.
 */
export async function fetchAttendanceWeek(): Promise<boolean[] | null> {
  return null
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

/** POST /api/v1/rewards/attendance */
export type AttendanceCheckResponse = {
  message: string
  isRandomBoxAvailable: boolean
}

function normalizeAttendanceCheckPayload(inner: unknown): AttendanceCheckResponse {
  if (typeof inner === 'string') {
    return { message: inner, isRandomBoxAvailable: false }
  }
  if (typeof inner !== 'object' || inner === null) {
    return { message: '출석체크가 완료되었습니다.', isRandomBoxAvailable: false }
  }
  const p = inner as Record<string, unknown>
  const message = str(p.message, '출석체크가 완료되었습니다.')
  const flag = p.isRandomBoxAvailable ?? p.is_random_box_available
  const isRandomBoxAvailable =
    flag === true || flag === 1 || String(flag).toLowerCase() === 'true'
  return { message, isRandomBoxAvailable }
}

export async function postAttendanceCheck(): Promise<AttendanceCheckResponse> {
  const raw = await apiV1FetchPlain<unknown>('/rewards/attendance', { method: 'POST' })
  const inner = unwrapApiEnvelope(raw)
  return normalizeAttendanceCheckPayload(inner)
}

export type RandomBoxApiResult = 'WIN_1000' | 'WIN_100' | 'LOSE'

/** POST /api/v1/rewards/random-box */
export type RandomBoxOpenResponse = {
  result: RandomBoxApiResult
}

function normalizeRandomBoxPayload(inner: unknown): RandomBoxOpenResponse {
  if (typeof inner !== 'object' || inner === null) {
    throw new ApiError('랜덤박스 응답 형식이 올바르지 않습니다.', { status: 200 })
  }
  const p = inner as Record<string, unknown>
  const raw = String(p.result ?? '').trim().toUpperCase()
  if (raw === 'WIN_1000' || raw === 'WIN_100' || raw === 'LOSE') {
    return { result: raw as RandomBoxApiResult }
  }
  throw new ApiError('랜덤박스 결과를 확인할 수 없습니다.', { status: 200 })
}

export async function postRandomBoxOpen(): Promise<RandomBoxOpenResponse> {
  const raw = await apiV1FetchPlain<unknown>('/rewards/random-box', { method: 'POST' })
  const inner = unwrapApiEnvelope(raw)
  return normalizeRandomBoxPayload(inner)
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
