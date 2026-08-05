/**
 * Auth 도메인 API (owner-web)
 * - 공통: /api/v1/auth (verify, login, me …)
 * - 사장님 가입: /api/v1/owner/auth/*
 * - 나머지 Owner 기능: api/owner/* (/api/v1/owner/dashboard|orders|menu|review|store)
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

export type AccountRole = 'USER' | 'OWNER' | string

export interface LoginResult {
  accessToken: string
  refreshToken: string
  email: string
  nickname: string
  /** BE LoginResponse.role — 예: OWNER / USER */
  role?: AccountRole | null
  /** 향후 Owner 로그인 응답에 storeId가 오면 사용 */
  storeId?: number | null
}

/** OWNER / ROLE_OWNER 등 표기 정규화 */
export function isOwnerRole(role: string | null | undefined): boolean {
  if (!role) return false
  const n = role.trim().toUpperCase().replace(/^ROLE_/, '')
  return n === 'OWNER'
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

/** POST /signup — 고객(USER) 가입 (user-web 공통) */
export function signup(body: SignupBody) {
  return apiV1Fetch<string>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(body),
    skipAuth: true,
  })
}

/** 사장님 회원가입 바디 — POST /api/v1/owner/auth/signup */
export interface OwnerSignupBody {
  email: string
  password: string
  ownerName: string
  ownerPhone: string
  storeName: string
  storePhone: string
  businessRegistrationNumber: string
  address: string
  /** 매장 카테고리 ID (1=한식 … 11=야식). 필수. 위·경도는 보내지 않음 */
  categoryId: number
  /** 신규 이메일: 이메일 인증 logId 필수. 기존 USER→OWNER 전환 시 null 가능 */
  logId?: number | null
}

/** POST /owner/auth/signup — 사장님 가입(+매장 생성). address+categoryId만 전송 */
export function ownerSignup(body: OwnerSignupBody) {
  return apiV1Fetch<string>('/owner/auth/signup', {
    method: 'POST',
    body: JSON.stringify(body),
    skipAuth: true,
  })
}

/** 기존 USER → OWNER 전환 — POST /api/v1/owner/auth/register */
export interface OwnerRegisterBody {
  storeName: string
  storePhone: string
  businessRegistrationNumber: string
  address: string
  categoryId: number
}

export function ownerRegister(body: OwnerRegisterBody) {
  return apiV1Fetch<string>('/owner/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
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

