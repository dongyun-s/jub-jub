import { ApiError } from '../api/authClient'
import { reissue } from '../api/auth'
import { getRefreshToken, setTokens } from './authStorage'

/**
 * 401/403 시 refresh 토큰으로 access 재발급 후 한 번 재시도.
 * (백엔드 수정 없이 만료·거부 토큰으로 인한 픽업 완료 실패 완화)
 */
export async function withAuthRetry<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request()
  } catch (e) {
    if (!(e instanceof ApiError) || (e.status !== 401 && e.status !== 403)) {
      throw e
    }
    const refresh = getRefreshToken()
    if (!refresh) throw e
    try {
      const tokens = await reissue(refresh)
      setTokens(tokens.accessToken, tokens.refreshToken)
      return await request()
    } catch {
      throw e
    }
  }
}
