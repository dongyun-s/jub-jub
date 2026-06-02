/** 백엔드 StoreCategory와 동일 id (user-web CATEGORY_TAB_TO_ID) */
export const STORE_CATEGORIES = [
  { id: 1, label: '한식' },
  { id: 2, label: '중식' },
  { id: 3, label: '일식' },
  { id: 4, label: '치킨' },
  { id: 5, label: '피자' },
  { id: 6, label: '카페' },
  { id: 7, label: '분식' },
  { id: 8, label: '양식' },
  { id: 9, label: '패스트푸드' },
  { id: 10, label: '디저트' },
  { id: 11, label: '야식' },
] as const

export type StoreCategoryId = (typeof STORE_CATEGORIES)[number]['id']

/** null = 기타 (고객 앱 필터에는 미분류) */
export type StoreCategorySelection = number | null

export function getStoreCategoryLabel(categoryId: StoreCategorySelection): string {
  if (categoryId == null) return '기타'
  return STORE_CATEGORIES.find((c) => c.id === categoryId)?.label ?? '기타'
}

export function isValidStoreCategoryId(id: number): boolean {
  return STORE_CATEGORIES.some((c) => c.id === id)
}
