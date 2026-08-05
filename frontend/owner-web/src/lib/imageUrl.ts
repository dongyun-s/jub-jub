/**
 * 업로드·리뷰 이미지 path → <img src>
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
