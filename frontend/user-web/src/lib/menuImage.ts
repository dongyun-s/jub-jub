import { resolveDisplayImageUrl } from './imageUrl'

/** 메뉴·가게 카드 사진 없을 때 쓰는 기본 이미지 (데모 Unsplash 사용 금지) */
export const DEFAULT_MENU_IMAGE = '/logo.png'
export const DEFAULT_STORE_IMAGE = '/logo.png'

/**
 * 등록된 메뉴 이미지 URL이 있으면 표시용으로 정규화하고,
 * 없거나 빈 값이면 기본 이미지를 반환한다.
 */
export function resolveMenuImageUrl(
  imageUrl: string | null | undefined,
  fallback: string = DEFAULT_MENU_IMAGE,
): string {
  const resolved = resolveDisplayImageUrl(imageUrl)
  return resolved || fallback
}

/** 가게 카드·지도 썸네일. API imageUrl이 있으면 그 사진, 없으면 기본 이미지. */
export function resolveStoreCardImage(imageUrl?: string | null): string {
  return resolveMenuImageUrl(imageUrl, DEFAULT_STORE_IMAGE)
}
