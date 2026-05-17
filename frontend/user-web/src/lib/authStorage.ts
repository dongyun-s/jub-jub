const ACCESS = 'jubjub_access_token'
const REFRESH = 'jubjub_refresh_token'
/** 프로필 API보다 먼저 쓰기 위한 로그인 이메일 (출석 로컬 키 등) */
const SESSION_EMAIL = 'jubjub_session_email'
/** /auth/me 에 memberProfileId 가 없을 때: 주문 생성 응답으로 채움 (리뷰 API용) */
const CACHED_MEMBER_PROFILE_ID = 'jubjub_cached_member_profile_id'

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(ACCESS)
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(REFRESH)
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ACCESS, accessToken)
  window.localStorage.setItem(REFRESH, refreshToken)
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(ACCESS)
  window.localStorage.removeItem(REFRESH)
  window.localStorage.removeItem(SESSION_EMAIL)
  window.localStorage.removeItem(CACHED_MEMBER_PROFILE_ID)
}

export function setSessionEmail(email: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SESSION_EMAIL, email.trim())
}

export function getSessionEmail(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(SESSION_EMAIL)
}

/** 주문 생성(createOrder) 직후 저장 — 리뷰·내 리뷰 목록에서 memberProfileId 대용 */
export function setCachedMemberProfileId(id: number): void {
  if (typeof window === 'undefined') return
  const n = Number(id)
  if (!Number.isFinite(n) || n <= 0) return
  window.localStorage.setItem(CACHED_MEMBER_PROFILE_ID, String(Math.trunc(n)))
}

export function getCachedMemberProfileId(): number | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(CACHED_MEMBER_PROFILE_ID)
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null
}

/**
 * /auth/me 에 memberProfileId 가 없을 때 리뷰 제출용 id 결정
 * 1) 프로필(향후 서버 확장) 2) 로컬 주문 행(__jubjub_local_orders) 3) createOrder 시 캐시
 */
export function resolveMemberProfileIdForReview(
  orderId: number,
  profileMemberProfileId?: number | null,
): number | null {
  const fromProfile = profileMemberProfileId != null ? Number(profileMemberProfileId) : NaN
  if (Number.isFinite(fromProfile) && fromProfile > 0) return Math.trunc(fromProfile)

  if (typeof window !== 'undefined' && orderId > 0) {
    try {
      const raw = window.localStorage.getItem('__jubjub_local_orders')
      const arr = raw ? (JSON.parse(raw) as Record<string, unknown>[]) : []
      if (Array.isArray(arr)) {
        const row = arr.find((o) => Number(o?.orderId) === orderId)
        const id = row?.memberProfileId
        const n = typeof id === 'number' ? id : Number(id)
        if (Number.isFinite(n) && n > 0) return Math.trunc(n)
      }
    } catch {
      /* ignore */
    }
  }

  return getCachedMemberProfileId()
}
