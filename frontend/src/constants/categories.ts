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
  '전체', '한식', '중식', '일식', '치킨', '피자', '분식', '카페', '양식', '패스트푸드', '디저트', '야식'
]

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
  points: string
  hashtags: string[]
  categoryId?: number
  /** 픽업/매장 지도 마커용 WGS84 (없으면 별도 폴백) */
  lat?: number
  lng?: number
}

/** 홈/카테고리 공통 맛집 던전 카드 데이터(API 실패 시 폴백) */
export const FEATURED_RESTAURANTS: FeaturedRestaurant[] = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
    tags: ['핫 미션', '포장 -10%'],
    title: '네온 피자 슬라이스',
    delivery: '배달 25-35분',
    minOrder: '최소 주문 15,000원',
    rating: 4.8,
    reviews: 2500,
    points: '+120',
    hashtags: ['#음폭맛집', '#치즈폭탄'],
    categoryId: 2,
    lat: 37.4979,
    lng: 127.0276,
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
    tags: ['신규 퀘스트'],
    title: '집밥의 정석 : 퀘스트 완료',
    delivery: '배달 30-45분',
    minOrder: '최소 주문 12,000원',
    rating: 4.9,
    reviews: 1200,
    points: '+150',
    hashtags: ['#한식', '#포근한맛집'],
    categoryId: 1,
    lat: 37.5012,
    lng: 127.0396,
  },
]
