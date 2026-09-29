import { resolveDisplayImageUrl } from './imageUrl'

/** 메뉴 사진 없을 때 쓰는 기본 이미지 (데모 Unsplash 사용 금지) */
export const DEFAULT_MENU_IMAGE = '/logo.png'

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
