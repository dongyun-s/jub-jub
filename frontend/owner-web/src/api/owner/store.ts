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
