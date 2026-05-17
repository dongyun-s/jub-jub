/**
 * 프로필 이미지 — S3 업로드 후 fileUrl(imagePath) 저장
 */
import { apiV1Fetch } from './authClient'

export interface ProfileImageResponse {
  mediaId: number | null
  imagePath: string | null
}

export function getMyProfileImage() {
  return apiV1Fetch<ProfileImageResponse>('/profile-image', { method: 'GET' })
}

export function createMyProfileImage(imagePath: string) {
  return apiV1Fetch<ProfileImageResponse>('/profile-image', {
    method: 'POST',
    body: JSON.stringify({ imagePath }),
  })
}

export function updateMyProfileImage(imagePath: string) {
  return apiV1Fetch<ProfileImageResponse>('/profile-image', {
    method: 'PUT',
    body: JSON.stringify({ imagePath }),
  })
}

export function deleteMyProfileImage() {
  return apiV1Fetch<null>('/profile-image', { method: 'DELETE' })
}
