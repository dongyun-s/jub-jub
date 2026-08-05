/**
 * Auth 토큰 저장소 (owner-web)
 * - user-web과 동일한 localStorage 키를 사용합니다.
 * - 토큰 키: jubjub_access_token / jubjub_refresh_token
 */

const ACCESS = 'jubjub_access_token'
const REFRESH = 'jubjub_refresh_token'

/** /auth/me 에서 필요한 보조정보 캐싱(호환용) */
const SESSION_EMAIL = 'jubjub_session_email'
const CACHED_MEMBER_PROFILE_ID = 'jubjub_cached_member_profile_id'
const SESSION_ROLE = 'jubjub_session_role'

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
  window.localStorage.removeItem(SESSION_ROLE)
}

export function setSessionEmail(email: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SESSION_EMAIL, email.trim())
}

export function getSessionEmail(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(SESSION_EMAIL)
}

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

export function setSessionRole(role: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SESSION_ROLE, role.trim())
}

export function getSessionRole(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(SESSION_ROLE)
}

