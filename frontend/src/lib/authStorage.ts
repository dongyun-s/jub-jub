const ACCESS = 'jubjub_access_token'
const REFRESH = 'jubjub_refresh_token'
/** 프로필 API보다 먼저 쓰기 위한 로그인 이메일 (출석 로컬 키 등) */
const SESSION_EMAIL = 'jubjub_session_email'

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
}

export function setSessionEmail(email: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SESSION_EMAIL, email.trim())
}

export function getSessionEmail(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(SESSION_EMAIL)
}
