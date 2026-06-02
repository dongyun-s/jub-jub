/**
 * Auth 도메인 API (owner-web)
 * - Base: /api/v1/auth
 * - UI는 owner-web 스타일이어도, 통신 로직/바디는 user-web과 동일하게 맞춥니다.
 */

import { apiV1Fetch } from './authClient'

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
  profileImagePath?: string | null
  /** GET /api/v1/auth/me — 리뷰 등에서 사용 */
  memberProfileId?: number | null
}

export interface TokenReissueResult {
  accessToken: string
  refreshToken: string
}

/** POST /verify/send */
export function verifySend(type: VerificationType, target: string) {
  return apiV1Fetch<VerificationSendResult>('/auth/verify/send', {
    method: 'POST',
    body: JSON.stringify({ type, target }),
    skipAuth: true,
  })
}

/** POST /verify/confirm */
export function verifyConfirm(logId: number, code: string) {
  return apiV1Fetch<VerificationConfirmResult>('/auth/verify/confirm', {
    method: 'POST',
    body: JSON.stringify({ logId, code }),
    skipAuth: true,
  })
}

/** POST /signup */
export function signup(body: SignupBody) {
  return apiV1Fetch<string>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(body),
    skipAuth: true,
  })
}

/** POST /login */
export function login(email: string, password: string) {
  return apiV1Fetch<LoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  })
}

/** GET /me (로그인 필요) */
export function getMe() {
  return apiV1Fetch<ProfileMe>('/auth/me', { method: 'GET' })
}

/** POST /reissue (로그인 필요 없음) */
export function reissue(refreshToken: string) {
  return apiV1Fetch<TokenReissueResult>('/auth/reissue', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
    skipAuth: true,
  })
}

/** POST /change-password (로그인 필요) */
export function changePassword(currentPassword: string, newPassword: string) {
  return apiV1Fetch<null>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

/** POST /find-id (로그인 필요 없음) */
export function findId(name: string, phone: string) {
  return apiV1Fetch<string>('/auth/find-id', {
    method: 'POST',
    body: JSON.stringify({ name, phone }),
    skipAuth: true,
  })
}

/** POST /find-password/send?email=... (로그인 필요 없음) */
export function findPasswordSend(email: string) {
  const q = new URLSearchParams({ email })
  return apiV1Fetch<number>(`/auth/find-password/send?${q.toString()}`, {
    method: 'POST',
    skipAuth: true,
  })
}

/** POST /reset-password (로그인 필요 없음) */
export function resetPassword(email: string, logId: number, newPassword: string) {
  return apiV1Fetch<null>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, logId, newPassword }),
    skipAuth: true,
  })
}

