import { apiV1Fetch } from './authClient'

export interface MenuDto {
  menuId: number
  name: string
  price: number
  description: string
  isSoldOut: boolean
  rewardXp: number
}

export interface StoreDetailDto {
  storeId: number
  name: string
  address: string
  phoneNumber: string
  originInfo: string
  cookingTimeMinutes: number
  minOrderAmount: number
  /** 매장 업종 (API 연동 시) */
  categoryId?: number | null
  imageUrl?: string | null
  operatingHours?: string | null
  notice?: string | null
  menus: MenuDto[]
}

/**
 * 고객용 매장 상세 (메뉴 포함).
 * Owner 전용은 `api/owner/store.fetchOwnerStore` / `api/owner/menu` 사용.
 */
export function fetchStoreDetail(storeId: number, options?: { skipAuth?: boolean }) {
  return apiV1Fetch<StoreDetailDto>(`/stores/${storeId}`, {
    method: 'GET',
    skipAuth: options?.skipAuth ?? true,
  })
}
