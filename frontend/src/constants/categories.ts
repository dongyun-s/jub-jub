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

/** 홈/카테고리 공통 맛집 던전 카드 데이터 */
export const FEATURED_RESTAURANTS = [
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
  },
]
