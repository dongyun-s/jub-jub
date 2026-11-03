/**
 * 리뷰·프로필 등 저장된 imagePath / fileUrl 을 <img src> 용으로 정규화
 * - 이미 절대 URL이면 그대로
 * - 상대 키(reviews/...)만 오는 경우: VITE_S3_PUBLIC_BASE_URL 이 있으면 앞에 붙임
 */
function resolveS3PublicBase(): string {
  const raw = (import.meta.env.VITE_S3_PUBLIC_BASE_URL as string | undefined)?.trim() ?? ''
  if (!raw) return ''
  // 플레이스홀더·한글 주소는 무시 (깨진 img src 방지)
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

/**
 * 리뷰 API가 `imagePaths` 배열 / 단일 문자열 / snake_case `image_paths` 로 줄 수 있어
 * 표시·개수 계산 전에 문자열 배열로 맞춘다.
 */
function stringFromImageEntry(x: unknown): string {
  if (typeof x === 'string') return x.trim()
  if (x == null) return ''
  if (typeof x === 'object' && !Array.isArray(x)) {
    const o = x as Record<string, unknown>
    const u = o.url ?? o.imagePath ?? o.image_path ?? o.fileUrl ?? o.file_url
    if (typeof u === 'string' && u.trim() !== '') return u.trim()
  }
  return String(x).trim()
}

export function normalizeReviewImageList(dto: Record<string, unknown>): string[] {
  const raw =
    dto.imagePaths ??
    dto.image_paths ??
    dto.images ??
    dto.reviewImages ??
    dto.review_images
  if (raw == null) return []
  if (Array.isArray(raw)) {
    return raw.map(stringFromImageEntry).filter((s) => s.length > 0)
  }
  if (typeof raw === 'string' && raw.trim() !== '') return [raw.trim()]
  return []
}
