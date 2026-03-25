/**
 * 매장·메뉴 API — GET /api/v1/stores, GET /api/v1/stores/{storeId}
 * (백엔드 StoreController, JWT Bearer)
 */
import { apiV1Fetch } from './authClient'

export interface StoreListItem {
  storeId: number
  name: string
  categoryId: number
  cookingTimeMinutes: number
  minOrderAmount: number
  latitude: number | null
  longitude: number | null
}

export interface MenuOptionDto {
  optionId: number
  name: string
  additionalPrice: number
  isRequired: boolean
}

export interface MenuDto {
  menuId: number
  name: string
  price: number
  description: string
  isSoldOut: boolean
  rewardXp: number
  options: MenuOptionDto[]
}

export interface StoreDetailDto {
  storeId: number
  name: string
  address: string
  phoneNumber: string
  originInfo: string
  cookingTimeMinutes: number
  minOrderAmount: number
  menus: MenuDto[]
}

export function fetchStores() {
  return apiV1Fetch<StoreListItem[]>('/stores')
}

export function fetchStoreDetail(storeId: number) {
  return apiV1Fetch<StoreDetailDto>(`/stores/${storeId}`)
}
