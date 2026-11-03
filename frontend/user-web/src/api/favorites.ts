/**
 * 찜 API — /api/v1/favorites, /api/v1/stores/{storeId}/favorites (인증 필요)
 * 백엔드가 ResponseEntity(String|List) 형태라 apiV1FetchPlain 사용
 */
import { apiV1FetchPlain } from './authClient'

export interface FavoriteStoreDto {
  favoriteId: number
  storeId: number
  storeName: string
  categoryName: string
  storeImageUrl: string
  rating: number
  reviewCount: number
  distance: number
  tags: string[]
  storeStatus: string
}

/** GET /api/v1/favorites */
export function fetchMyFavorites() {
  return apiV1FetchPlain<FavoriteStoreDto[]>('/favorites', { method: 'GET' })
}

/** POST /api/v1/stores/{storeId}/favorites */
export function toggleStoreFavorite(storeId: number) {
  return apiV1FetchPlain<string>(`/stores/${storeId}/favorites`, { method: 'POST' })
}

