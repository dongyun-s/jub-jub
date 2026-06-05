import type { SortedStoreListItem, StoreListItem } from '../api/store'
import type { FeaturedRestaurant } from '../constants'
import { CATEGORY_TAB_TO_ID, STORE_LIST_CARD_IMAGES } from '../constants'

export function formatStoreDistanceMeters(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return ''
  if (meters < 1000) return `${Math.round(meters)}m`
  const km = Math.round((meters / 1000) * 10) / 10
  return `${km}km`
}

export function mapSortedStoreToFeatured(s: SortedStoreListItem): FeaturedRestaurant {
  const id = Number(s.storeId)
  const img = STORE_LIST_CARD_IMAGES[Math.abs(id) % STORE_LIST_CARD_IMAGES.length]
  const categoryLabel = s.categoryName?.trim() || undefined
  const dist = formatStoreDistanceMeters(s.distanceMeters)
  return {
    id,
    image: img,
    tags: dist ? ['3km 이내', '포장 픽업'] : ['포장 픽업'],
    title: s.name,
    delivery: dist
      ? `${dist} · 픽업 약 ${s.cookingTimeMinutes}분`
      : `픽업 약 ${s.cookingTimeMinutes}분`,
    minOrder: `최소 주문 ${s.minOrderAmount.toLocaleString()}원`,
    rating: Math.round(s.averageRating * 10) / 10 || 0,
    reviews: s.reviewCount,
    hashtags: categoryLabel ? [`#${categoryLabel}`, '#줍줍'] : ['#줍줍'],
    categoryId: s.categoryId,
    lat: s.latitude ?? undefined,
    lng: s.longitude ?? undefined,
    distanceMeters: s.distanceMeters,
  }
}

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
    rating: 0,
    reviews: 0,
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
