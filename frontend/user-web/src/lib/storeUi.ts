import type { StoreListItem } from '../api/store'
import type { FeaturedRestaurant } from '../constants'
import { CATEGORY_TAB_TO_ID, STORE_LIST_CARD_IMAGES } from '../constants'

export function mapStoreListItemToFeatured(s: StoreListItem): FeaturedRestaurant {
  const id = Number(s.storeId)
  const img = STORE_LIST_CARD_IMAGES[Math.abs(id) % STORE_LIST_CARD_IMAGES.length]
  const categoryLabel = s.categoryName?.trim() || undefined
  return {
    id,
    image: img,
    tags: ['포장 픽업'],
    title: s.name,
    delivery: `픽업 약 ${s.cookingTimeMinutes}분`,
    minOrder: `최소 주문 ${s.minOrderAmount.toLocaleString()}원`,
    rating: 4.8,
    reviews: 320,
    points: `+${Math.min(200, Math.round(s.minOrderAmount / 120))}`,
    hashtags: categoryLabel ? [`#${categoryLabel}`, '#줍줍'] : ['#줍줍'],
    categoryId: s.categoryId,
    lat: s.latitude ?? undefined,
    lng: s.longitude ?? undefined,
  }
}

export function restaurantMatchesCategoryTab(tab: string, r: FeaturedRestaurant): boolean {
  if (tab === '전체') return true
  const expectedId = CATEGORY_TAB_TO_ID[tab]
  if (expectedId == null) return true
  if (r.categoryId == null) return false
  return r.categoryId === expectedId
}
