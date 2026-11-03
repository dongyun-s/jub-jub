import { ApiError } from '../api/authClient'
import { reissue } from '../api/auth'
import { clearTokens, getRefreshToken, setTokens } from './authStorage'

/**
 * 401/403 시 refresh 토큰으로 access 재발급 후 한 번 재시도.
 * 재발급 실패 시 토큰을 지워 반쯤 로그인된 상태를 남기지 않는다.
 */
export async function withAuthRetry<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request()
  } catch (e) {
    if (!(e instanceof ApiError) || (e.status !== 401 && e.status !== 403)) {
      throw e
    }
    const refresh = getRefreshToken()
    if (!refresh) {
      clearTokens()
      throw e
    }
    try {
      const tokens = await reissue(refresh)
      setTokens(tokens.accessToken, tokens.refreshToken)
      return await request()
    } catch {
      clearTokens()
      throw e
    }
  }
}
