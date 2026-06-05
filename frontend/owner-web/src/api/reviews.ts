import { apiFetch, ApiError } from './authClient'

export interface ReviewDto {
  reviewId: number
  orderId: number
  memberProfileId: number
  storeId: number
  overallRating: number
  content: string
  createdAt?: string
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (!Number.isNaN(n)) return n
  }
  return fallback
}

function normalizeReviewDto(raw: unknown): ReviewDto | null {
  if (typeof raw !== 'object' || raw === null) return null
  const p = raw as Record<string, unknown>
  const reviewId = num(p.reviewId ?? p.review_id ?? p.id)
  if (!reviewId) return null
  return {
    reviewId,
    orderId: num(p.orderId ?? p.order_id),
    memberProfileId: num(p.memberProfileId ?? p.member_profile_id),
    storeId: num(p.storeId ?? p.store_id),
    overallRating: num(p.overallRating ?? p.overall_rating, 5),
    content: String(p.content ?? '').trim(),
    createdAt: p.createdAt != null ? String(p.createdAt) : p.created_at != null ? String(p.created_at) : undefined,
  }
}

function parseReviewList(body: unknown): ReviewDto[] {
  if (Array.isArray(body)) {
    return body.map(normalizeReviewDto).filter(Boolean) as ReviewDto[]
  }
  if (typeof body === 'object' && body !== null) {
    const o = body as Record<string, unknown>
    const arr = o.data ?? o.reviews ?? o.items
    if (Array.isArray(arr)) return parseReviewList(arr)
  }
  return []
}

export async function fetchStoreReviews(storeId: number): Promise<ReviewDto[]> {
  try {
    const raw = await apiFetch<unknown>(`/api/reviews/store/${storeId}`, { method: 'GET' })
    return parseReviewList(raw)
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      throw new ApiError(
        '리뷰 조회에 로그인이 필요합니다. frontend/.env 에 VITE_OWNER_DEV_TOKEN 을 설정하거나 사장님 로그인을 연동해 주세요.',
        { status: e.status, code: e.code },
      )
    }
    throw e
  }
}
