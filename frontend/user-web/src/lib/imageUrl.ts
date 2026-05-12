/**
 * 리뷰·프로필 등 저장된 imagePath / fileUrl 을 <img src> 용으로 정규화
 * - 이미 절대 URL이면 그대로
 * - 상대 키(reviews/...)만 오는 경우: VITE_S3_PUBLIC_BASE_URL 이 있으면 앞에 붙임
 */
const S3_PUBLIC_BASE = (import.meta.env.VITE_S3_PUBLIC_BASE_URL as string | undefined)?.trim().replace(/\/$/, '') ?? ''

export function resolveDisplayImageUrl(path: string | null | undefined): string {
  if (path == null || typeof path !== 'string') return ''
  const p = path.trim()
  if (!p) return ''
  if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('data:') || p.startsWith('blob:')) {
    return p
  }
  if (p.startsWith('//')) return `https:${p}`
  if (S3_PUBLIC_BASE) {
    const key = p.startsWith('/') ? p.slice(1) : p
    return `${S3_PUBLIC_BASE}/${key}`
  }
  return p
}
