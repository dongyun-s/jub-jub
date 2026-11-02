/**
 * 업로드·리뷰 이미지 path → <img src>
 */
function resolveS3PublicBase(): string {
  const raw = (import.meta.env.VITE_S3_PUBLIC_BASE_URL as string | undefined)?.trim() ?? ''
  if (!raw) return ''
  if (!/^https?:\/\//i.test(raw) || /[^\x00-\x7F]/.test(raw)) return ''
  if (/이미지-CloudFront|example\.com|placeholder/i.test(raw)) return ''
  return raw.replace(/\/$/, '')
}

const S3_PUBLIC_BASE = resolveS3PublicBase()

function isUsableHttpUrl(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return false
  if (/via\.placeholder\.com|placeholder\.com|이미지-CloudFront/i.test(url)) return false
  return true
}

export function resolveDisplayImageUrl(path: string | null | undefined): string {
  if (path == null || typeof path !== 'string') return ''
  const p = path.trim()
  if (!p) return ''
  if (p.startsWith('data:') || p.startsWith('blob:')) return p
  if (p.startsWith('http://') || p.startsWith('https://')) {
    return isUsableHttpUrl(p) ? p : ''
  }
  if (p.startsWith('//')) {
    const abs = `https:${p}`
    return isUsableHttpUrl(abs) ? abs : ''
  }
  if (S3_PUBLIC_BASE) {
    const key = p.startsWith('/') ? p.slice(1) : p
    return `${S3_PUBLIC_BASE}/${key}`
  }
  return ''
}
