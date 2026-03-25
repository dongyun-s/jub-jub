/**
 * 스토어 API → 홈/카테고리 카드, 카테고리 탭 필터
 */
import type { StoreListItem } from '../api/store'
import type { FeaturedRestaurant } from '../constants/categories'
import { STORE_LIST_CARD_IMAGES } from '../constants/categories'

export function mapStoreListItemToFeatured(s: StoreListItem): FeaturedRestaurant {
  const id = Number(s.storeId)
  const img = STORE_LIST_CARD_IMAGES[Math.abs(id) % STORE_LIST_CARD_IMAGES.length]
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
    hashtags: [`#cat${s.categoryId}`, '#줍줍'],
    categoryId: s.categoryId,
  }
}

/** 백엔드 categoryId와 카테고리 상세 탭 매핑 (더미 데이터 기준) */
const TAB_CATEGORY_IDS: Record<string, number[]> = {
  한식: [1],
  일식: [1],
  패스트푸드: [2],
}

export function restaurantMatchesCategoryTab(tab: string, r: FeaturedRestaurant): boolean {
  if (tab === '전체') return true
  const ids = TAB_CATEGORY_IDS[tab]
  if (!ids) return true
  if (r.categoryId == null) return true
  return ids.includes(r.categoryId)
}
