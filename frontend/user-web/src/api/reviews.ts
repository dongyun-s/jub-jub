/**
 * 리뷰 API — `/api/reviews/*` (Vite `/api` 프록시·직접 호출 공통)
 */
import { apiFetch, ApiError } from './authClient'

/** 주문내역·리뷰 관리에서 리뷰 작성/수정 화면으로 넘길 맥락 */
export interface ReviewWritePayload {
  storeName: string
  orderId: number
  storeId: number
  /** 있으면 수정 모드 */
  reviewId?: number
}

export interface AiReviewGenerateBody {
  packagingRating?: number
  tasteRating?: number
  timeRating?: number
  content?: string
}

export interface AiReviewGenerateResponse {
  generatedReview: string
}

export interface ReviewDto {
  reviewId: number
  orderId: number
  memberProfileId: number
  storeId: number
  overallRating: number
  packagingRating?: number | null
  tasteRating?: number | null
  timeRating?: number | null
  content: string
  aiGeneratedHelped?: boolean | null
  createdAt?: string
  /** 백엔드 ReviewResponse 필드명 */
  imagePaths?: string[]
}

export interface ReviewCreateBody {
  orderId: number
  memberProfileId: number
  storeId: number
  overallRating: number
  packagingRating?: number | null
  tasteRating?: number | null
  timeRating?: number | null
  content: string
  aiGeneratedHelped: boolean
  imagePaths?: string[]
}

export interface ReviewUpdateBody {
  memberProfileId: number
  overallRating: number
  packagingRating?: number | null
  tasteRating?: number | null
  timeRating?: number | null
  content: string
  aiGeneratedHelped?: boolean | null
  imagePaths?: string[]
}

export interface ReviewDeleteBody {
  memberProfileId: number
}

export function generateAiReview(body: AiReviewGenerateBody) {
  return apiFetch<AiReviewGenerateResponse>('/api/reviews/ai-generate', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function createReview(body: ReviewCreateBody) {
  return apiFetch<ReviewDto>('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function fetchReview(reviewId: number): Promise<ReviewDto> {
  const raw = await apiFetch<unknown>(`/api/reviews/${reviewId}`, { method: 'GET' })
  const inner =
    typeof raw === 'object' && raw !== null && 'success' in raw && (raw as { success?: boolean }).success === true
      ? (raw as { data?: unknown }).data
      : raw
  const dto = normalizeReviewDto(inner)
  if (!dto) {
    throw new ApiError('리뷰 정보 형식이 올바르지 않습니다.', { status: 200 })
  }
  return dto
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (!Number.isNaN(n)) return n
  }
  return fallback
}

function optNum(v: unknown): number | null | undefined {
  if (v === null || v === undefined) return v as null | undefined
  const n = num(v, NaN)
  return Number.isNaN(n) ? undefined : n
}

function normalizeReviewDto(raw: unknown): ReviewDto | null {
  if (typeof raw !== 'object' || raw === null) return null
  const p = raw as Record<string, unknown>
  const reviewId = num(p.reviewId ?? p.review_id ?? p.id)
  const orderId = num(p.orderId ?? p.order_id)
  const memberProfileId = num(p.memberProfileId ?? p.member_profile_id)
  const storeId = num(p.storeId ?? p.store_id)
  const overallRating = num(p.overallRating ?? p.overall_rating)
  const content = String(p.content ?? '').trim()
  if (!reviewId || !orderId || !storeId || !overallRating) return null

  const imagePathsRaw = p.imagePaths ?? p.image_paths
  const imagePaths = Array.isArray(imagePathsRaw)
    ? imagePathsRaw.map((x) => String(x)).filter(Boolean)
    : undefined

  return {
    reviewId,
    orderId,
    memberProfileId,
    storeId,
    overallRating,
    packagingRating: optNum(p.packagingRating ?? p.packaging_rating) ?? null,
    tasteRating: optNum(p.tasteRating ?? p.taste_rating) ?? null,
    timeRating: optNum(p.timeRating ?? p.time_rating) ?? null,
    content,
    aiGeneratedHelped:
      p.aiGeneratedHelped === true ||
      p.ai_generated_helped === true ||
      p.aiGeneratedHelped === 1,
    createdAt:
      typeof p.createdAt === 'string'
        ? p.createdAt
        : typeof p.created_at === 'string'
          ? p.created_at
          : undefined,
    imagePaths,
  }
}

function parseReviewList(body: unknown): ReviewDto[] {
  if (Array.isArray(body)) {
    return body.map(normalizeReviewDto).filter(Boolean) as ReviewDto[]
  }
  if (typeof body === 'object' && body !== null) {
    const o = body as Record<string, unknown>
    if (o.success === true && Array.isArray(o.data)) {
      return parseReviewList(o.data)
    }
    const arr = o.data ?? o.reviews ?? o.items
    if (Array.isArray(arr)) return parseReviewList(arr)
  }
  return []
}

export async function fetchStoreReviews(storeId: number): Promise<ReviewDto[]> {
  const raw = await apiFetch<unknown>(`/api/reviews/store/${storeId}`, { method: 'GET' })
  return parseReviewList(raw)
}

export function fetchStoreReviewsByTasteRating(storeId: number, rating: number) {
  const q = new URLSearchParams({ rating: String(rating) })
  return apiFetch<ReviewDto[]>(`/api/reviews/store/${storeId}/taste-rating?${q}`, { method: 'GET' })
}

export async function fetchMyReviews(memberProfileId: number): Promise<ReviewDto[]> {
  const raw = await apiFetch<unknown>(`/api/reviews/my/${memberProfileId}`, { method: 'GET' })
  return parseReviewList(raw)
}

export function updateReview(reviewId: number, body: ReviewUpdateBody) {
  return apiFetch<ReviewDto>(`/api/reviews/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function deleteReview(reviewId: number, body: ReviewDeleteBody) {
  return apiFetch<string>(`/api/reviews/${reviewId}`, {
    method: 'DELETE',
    body: JSON.stringify(body),
  })
}
