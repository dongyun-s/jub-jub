/**
 * 회원 API — 손님과 동일 (Account 공통)
 * DELETE /api/v1/users/me?password=... 탈퇴 (OWNER도 사용 가능, role 제한 없음)
 */
import { apiV1Fetch } from './authClient'

export function deleteMyAccount(password: string) {
  const qs = new URLSearchParams({ password: password.trim() })
  return apiV1Fetch<null>(`/users/me?${qs.toString()}`, {
    method: 'DELETE',
  })
}
