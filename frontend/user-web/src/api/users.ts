/**
 * 유저(마이페이지) 도메인 API — Base: /api/v1/users
 * - PUT /users/me: 닉네임/전화번호 부분 수정
 * - DELETE /users/me?password=...: 회원 탈퇴(soft delete)
 */
import { apiV1Fetch } from './authClient'

export type UpdateMyProfileBody = {
  nickname?: string | null
  phone?: string | null
}

/** PUT /api/v1/users/me */
export function updateMyProfile(body: UpdateMyProfileBody) {
  return apiV1Fetch<null>('/users/me', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

/** DELETE /api/v1/users/me?password=... */
export function deleteMyAccount(password: string) {
  const pw = password.trim()
  const qs = new URLSearchParams({ password: pw })
  return apiV1Fetch<null>(`/users/me?${qs.toString()}`, {
    method: 'DELETE',
  })
}

