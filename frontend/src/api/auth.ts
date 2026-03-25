/**
 * Auth 도메인 API — Base: /api/v1/auth (백엔드 AuthController와 동일)
 */
import { authFetch } from './authClient'

export type VerificationType = 'EMAIL' | 'SMS'

export interface VerificationSendResult {
  logId: number
  expiresAt: string
}

export interface VerificationConfirmResult {
  isVerified: boolean
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  email: string
  nickname: string
}

export interface SignupBody {
  email: string
  password: string
  name: string
  phone: string
  nickname: string
}

export interface ProfileMe {
  email: string
  name: string
  phone: string
  nickname: string
}

export interface TokenReissueResult {
  accessToken: string
  refreshToken: string
}

/** POST /verify/send */
export function verifySend(type: VerificationType, target: string) {
  return authFetch<VerificationSendResult>('/verify/send', {
    method: 'POST',
    body: JSON.stringify({ type, target }),
    skipAuth: true,
  })
}

/** POST /verify/confirm */
export function verifyConfirm(logId: number, code: string) {
  return authFetch<VerificationConfirmResult>('/verify/confirm', {
    method: 'POST',
    body: JSON.stringify({ logId, code }),
    skipAuth: true,
  })
}

/** POST /signup */
export function signup(body: SignupBody) {
  return authFetch<string>('/signup', {
    method: 'POST',
    body: JSON.stringify(body),
    skipAuth: true,
  })
}

/** POST /login */
export function login(email: string, password: string) {
  return authFetch<LoginResult>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  })
}

/** GET /me */
export function getMe() {
  return authFetch<ProfileMe>('/me', { method: 'GET' })
}

/** POST /reissue */
export function reissue(refreshToken: string) {
  return authFetch<TokenReissueResult>('/reissue', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
    skipAuth: true,
  })
}

/** POST /change-password */
export function changePassword(currentPassword: string, newPassword: string) {
  return authFetch<null>('/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

/** POST /find-id — 이름 + 휴대폰만 (백엔드 FindIdRequest) */
export function findId(name: string, phone: string) {
  return authFetch<string>('/find-id', {
    method: 'POST',
    body: JSON.stringify({ name, phone }),
    skipAuth: true,
  })
}

/** POST /find-password/send?email= */
export function findPasswordSend(email: string): Promise<number> {
  const q = new URLSearchParams({ email })
  return authFetch<number>(`/find-password/send?${q.toString()}`, {
    method: 'POST',
    skipAuth: true,
  })
}

/** POST /reset-password */
export function resetPassword(email: string, logId: number, newPassword: string) {
  return authFetch<null>('/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, logId, newPassword }),
    skipAuth: true,
  })
}
