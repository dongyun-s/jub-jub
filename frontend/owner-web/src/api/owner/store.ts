/**
 * Owner 매장 API — /api/v1/owner/store
 * 명세: 사장님_매장_카테고리_및_주소_좌표_변환_API_명세서.pdf
 * 프론트는 address + categoryId 만 전송 (위·경도는 BE/TMAP)
 */
import { apiV1Fetch } from '../authClient'
import { OWNER_API } from './paths'

/** OPEN | PAUSED | CLOSED */
export type OwnerStoreStatus = 'OPEN' | 'PAUSED' | 'CLOSED' | string

export type OwnerStoreDto = {
  storeId: number
  name: string
  address: string
  phoneNumber: string
  categoryId?: number | null
  categoryName?: string | null
  latitude?: number | null
  longitude?: number | null
  status: OwnerStoreStatus
  cookingTimeMinutes?: number
  minOrderAmount?: number
  originInfo?: string | null
  /** 등록된 대표 이미지. 없으면 null */
  imageUrl?: string | null
  /** 운영시간 안내 문구. 미등록·삭제 시 null */
  operatingHours?: string | null
  /** 매장 안내사항. 미등록·삭제 시 null */
  notice?: string | null
}

export type OwnerStoreStatusBody = {
  status: OwnerStoreStatus
}

/** PATCH /api/v1/owner/store — 주소·카테고리 보정 (좌표는 BE 변환) */
export type OwnerStorePatchBody = {
  address: string
  categoryId: number
}

function storePath(suffix = ''): string {
  return `${OWNER_API.store}${suffix}`
}

/** GET /api/v1/owner/store */
export function fetchOwnerStore() {
  return apiV1Fetch<OwnerStoreDto>(storePath(), { method: 'GET' })
}

/** PATCH /api/v1/owner/store */
export function patchOwnerStore(body: OwnerStorePatchBody) {
  return apiV1Fetch<OwnerStoreDto>(storePath(), {
    method: 'PATCH',
    body: JSON.stringify({
      address: body.address.trim(),
      categoryId: body.categoryId,
    }),
  })
}

/** PATCH /api/v1/owner/store/status */
export function updateOwnerStoreStatus(body: OwnerStoreStatusBody) {
  return apiV1Fetch<OwnerStoreDto>(storePath('/status'), {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

/** PATCH /api/v1/owner/store/min-order */
export function updateOwnerStoreMinOrder(minOrderAmount: number) {
  return apiV1Fetch<OwnerStoreDto>(storePath('/min-order'), {
    method: 'PATCH',
    body: JSON.stringify({ minOrderAmount: Math.max(0, Math.floor(minOrderAmount)) }),
  })
}

/** PATCH /api/v1/owner/store/image — 업로드 응답 fileUrl을 imageUrl로 등록 */
export function updateOwnerStoreImage(imageUrl: string) {
  const trimmed = imageUrl.trim()
  return apiV1Fetch<OwnerStoreDto>(storePath('/image'), {
    method: 'PATCH',
    body: JSON.stringify({ imageUrl: trimmed }),
  })
}

/** PATCH /api/v1/owner/store/origin */
export function updateOwnerStoreOrigin(originInfo: string) {
  return apiV1Fetch<OwnerStoreDto>(storePath('/origin'), {
    method: 'PATCH',
    body: JSON.stringify({ originInfo: originInfo.trim() }),
  })
}

/** PATCH /api/v1/owner/store/cooking-time — 1분 이상 */
export function updateOwnerStoreCookingTime(cookingTimeMinutes: number) {
  const minutes = Math.round(cookingTimeMinutes)
  return apiV1Fetch<OwnerStoreDto>(storePath('/cooking-time'), {
    method: 'PATCH',
    body: JSON.stringify({ cookingTimeMinutes: minutes }),
  })
}

/** PATCH /api/v1/owner/store/info — 두 필드를 항상 함께 전송. 빈 문자열은 삭제 */
export function updateOwnerStoreInfo(body: { operatingHours: string; notice: string }) {
  return apiV1Fetch<OwnerStoreDto>(storePath('/info'), {
    method: 'PATCH',
    body: JSON.stringify({
      operatingHours: body.operatingHours.trim(),
      notice: body.notice.trim(),
    }),
  })
}
