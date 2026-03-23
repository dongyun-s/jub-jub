const ACCESS = 'jubjub_access_token'
const REFRESH = 'jubjub_refresh_token'

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
}
