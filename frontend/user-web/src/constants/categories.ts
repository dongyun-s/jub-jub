/**
 * categories.ts
 * 카테고리·필터 UI에 쓰는 상수
 * - 홈 카테고리 그리드, 카테고리 상세 탭, 정렬/필터 옵션
 */

/** 홈 화면에 보이는 카테고리 버튼 (아이콘 + 라벨) */
export const HOME_CATEGORIES = [
  { icon: 'rice_bowl', label: '한식' },
  { icon: 'ramen_dining', label: '중식' },
  { icon: 'set_meal', label: '일식' },
  { icon: 'egg_alt', label: '치킨' },
  { icon: 'local_pizza', label: '피자' },
  { icon: 'coffee', label: '카페' },
  { icon: 'fastfood', label: '분식' },
  { icon: 'more_horiz', label: '더보기' },
]

/** 카테고리 상세 페이지 상단 탭 (전체, 한식, 중식, …) */
export const CATEGORY_TABS = [
  '전체', '한식', '중식', '일식', '치킨', '피자', '카페', '분식', '양식', '패스트푸드', '디저트', '야식'
]

/** 백엔드 StoreCategory id — 탭 라벨과 1:1 (전체는 null) */
export const CATEGORY_TAB_TO_ID: Record<string, number | null> = {
  전체: null,
  한식: 1,
  중식: 2,
  일식: 3,
  치킨: 4,
  피자: 5,
  카페: 6,
  분식: 7,
  양식: 8,
  패스트푸드: 9,
  디저트: 10,
  야식: 11,
}

export function categoryTabToApiParam(tab: string): { categoryId?: number; category?: string } {
  if (tab === '전체') return {}
  const id = CATEGORY_TAB_TO_ID[tab]
  if (id != null) return { categoryId: id, category: tab }
  return { category: tab }
}

/** 카테고리 상세 페이지 정렬 버튼 (거리/평점 정렬 선택용 단일 버튼) */
export const FILTER_OPTIONS = [
  { id: 'sort', label: '정렬', icon: 'tune' },
]

/** API 매장 카드용 이미지 순환 */
export const STORE_LIST_CARD_IMAGES = [
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop',
]

export interface FeaturedRestaurant {
  id: number
  image: string
  tags: string[]
  title: string
  delivery: string
  minOrder: string
  rating: number
  reviews: number
  hashtags: string[]
  categoryId?: number
  /** 픽업/매장 지도 마커용 WGS84 */
  lat?: number
  lng?: number
  /** /stores/sorted 응답 — 3km 이내 거리(m) */
  distanceMeters?: number
}

/** 매장 ID 기준 카드 썸네일 (API 이미지 없을 때) */
export function storeCardImageById(storeId?: number | null): string {
  const idx = storeId != null ? Math.abs(storeId) % STORE_LIST_CARD_IMAGES.length : 0
  return STORE_LIST_CARD_IMAGES[idx]!
}
