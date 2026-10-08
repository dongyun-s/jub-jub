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

/** 매장 대표 이미지가 없을 때 카드·주문 썸네일 */
export function storeCardImageById(_storeId?: number | null): string {
  return '/logo.png'
}
