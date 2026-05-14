/**
 * S3 Presigned URL 업로드 — 백엔드 명세와 동일 흐름
 * 1) POST /api/v1/uploads/presigned-url
 * 2) PUT {uploadUrl} (Authorization 없음, Content-Type = presign 요청과 동일)
 */
import { ApiError, apiV1Fetch } from './authClient'

export type ImageUploadType = 'PROFILE' | 'REVIEW' | 'STORE' | 'MENU'

export interface PresignedUploadRequestBody {
  uploadType: ImageUploadType
  originalFileName: string
  contentType: string
  fileSize: number
}

export interface PresignedUploadData {
  objectKey: string
  uploadUrl: string
  fileUrl: string
  expiresAt: string
}

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024
export const MAX_REVIEW_IMAGES = 5

/** presign 요청·S3 PUT 모두에 동일하게 사용할 MIME (빈 file.type 보정) */
export function resolveImageContentType(file: File): string {
  if (file.type && ALLOWED_IMAGE_TYPES.has(file.type)) {
    return file.type
  }
  const ext = file.name.includes('.')
    ? file.name.split('.').pop()?.toLowerCase().trim() ?? ''
    : ''
  const fromExt = ext ? EXT_TO_MIME[ext] : undefined
  if (fromExt) return fromExt
  throw new ApiError('지원하는 이미지 형식(JPEG, PNG, WebP, GIF)만 업로드할 수 있습니다.', {
    code: 'UNSUPPORTED_CONTENT_TYPE',
    status: 400,
  })
}

export function assertImageFileConstraints(file: File): void {
  resolveImageContentType(file)
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new ApiError('이미지 용량은 10MB 이하여야 합니다.', { code: 'FILE_TOO_LARGE', status: 400 })
  }
}

function normalizePresignedPayload(raw: PresignedUploadData | Record<string, unknown>): PresignedUploadData {
  const o = raw as Record<string, unknown>
  const uploadUrl = String(o.uploadUrl ?? o.upload_url ?? '').trim()
  const fileUrl = String(o.fileUrl ?? o.file_url ?? '').trim()
  const objectKey = String(o.objectKey ?? o.object_key ?? '').trim()
  const expiresAt = String(o.expiresAt ?? o.expires_at ?? '')
  return { objectKey, uploadUrl, fileUrl, expiresAt }
}

export async function requestPresignedUpload(body: PresignedUploadRequestBody): Promise<PresignedUploadData> {
  const raw = await apiV1Fetch<PresignedUploadData | Record<string, unknown>>('/uploads/presigned-url', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return normalizePresignedPayload(raw)
}

/** S3로 직접 업로드 — Authorization 헤더를 넣으면 안 됨 */
export async function putFileToPresignedUrl(
  uploadUrl: string,
  file: File,
  contentType: string
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  })
  if (!res.ok) {
    throw new ApiError('이미지 저장(S3)에 실패했습니다. 네트워크와 파일 형식을 확인해 주세요.', {
      status: res.status,
    })
  }
}

/** presign → S3 PUT 까지 한 번에 */
export async function uploadImageFileViaPresigned(uploadType: ImageUploadType, file: File): Promise<string> {
  assertImageFileConstraints(file)
  const contentType = resolveImageContentType(file)
  const data = await requestPresignedUpload({
    uploadType,
    originalFileName: file.name || 'image',
    contentType,
    fileSize: file.size,
  })
  await putFileToPresignedUrl(data.uploadUrl, file, contentType)
  const fileUrl = (data.fileUrl ?? '').trim()
  if (!fileUrl) {
    throw new ApiError('업로드 응답에 이미지 URL이 없습니다. 잠시 후 다시 시도해 주세요.', { status: 502 })
  }
  return fileUrl
}
