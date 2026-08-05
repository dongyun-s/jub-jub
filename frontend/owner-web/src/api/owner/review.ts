/**
 * Owner 리뷰 관리 API — /api/v1/owner/review
 * 명세: Owner_리뷰_관리_API_최종_명세.pdf
 */
import { apiV1Fetch } from '../authClient'
import { OWNER_API } from './paths'

export type OwnerReviewFilter = 'ALL' | 'UNANSWERED' | 'PHOTO'

export type OwnerReviewListItemDto = {
  reviewId: number
  orderId: number
  reviewerName: string
  overallRating: number
  content: string
  createdAt?: string
  imagePaths: string[]
  answered: boolean
  replyContent: string | null
}

export type OwnerReviewListDto = {
  reviews: OwnerReviewListItemDto[]
  count: number
}

export type OwnerReviewListParams = {
  filter?: OwnerReviewFilter
  keyword?: string
}

export type OwnerRatingDistributionDto = {
  oneStar: number
  twoStar: number
  threeStar: number
  fourStar: number
  fiveStar: number
}

export type OwnerReviewSummaryDto = {
  averageRating: number
  totalReviewCount: number
  unansweredReviewCount: number
  photoReviewCount: number
  ratingDistribution: OwnerRatingDistributionDto
}

export type OwnerReviewReplyDto = {
  replyId: number
  content: string
  createdAt?: string
  updatedAt?: string
}

export type OwnerReviewDetailDto = {
  reviewId: number
  orderId: number
  orderNumber?: string
  menuNames?: string[]
  reviewerName: string
  overallRating: number
  tasteRating?: number
  packagingRating?: number
  timeRating?: number
  content: string
  createdAt?: string
  imagePaths: string[]
  reply: OwnerReviewReplyDto | null
}

export type OwnerReviewReplyResultDto = {
  replyId: number
  reviewId: number
  content: string
  createdAt?: string
  updatedAt?: string
}

export type OwnerReviewInsightDto = {
  reviewId: number
  summary: string
  highlights: string[]
}

function reviewPath(suffix = ''): string {
  return `${OWNER_API.review}${suffix}`
}

/** GET /api/v1/owner/review */
export function fetchOwnerReviews(params?: OwnerReviewListParams) {
  const q = new URLSearchParams()
  if (params?.filter && params.filter !== 'ALL') q.set('filter', params.filter)
  else if (params?.filter === 'ALL') q.set('filter', 'ALL')
  const kw = params?.keyword?.trim()
  if (kw) q.set('keyword', kw)
  const qs = q.toString()
  return apiV1Fetch<OwnerReviewListDto>(`${reviewPath()}${qs ? `?${qs}` : ''}`, { method: 'GET' })
}

/** GET /api/v1/owner/review/summary */
export function fetchOwnerReviewSummary() {
  return apiV1Fetch<OwnerReviewSummaryDto>(reviewPath('/summary'), { method: 'GET' })
}

/** GET /api/v1/owner/review/{reviewId} */
export function fetchOwnerReviewDetail(reviewId: number) {
  return apiV1Fetch<OwnerReviewDetailDto>(reviewPath(`/${reviewId}`), { method: 'GET' })
}

/** POST /api/v1/owner/review/{reviewId}/reply — 답글 최초 작성 */
export function createOwnerReviewReply(reviewId: number, content: string) {
  return apiV1Fetch<OwnerReviewReplyResultDto>(reviewPath(`/${reviewId}/reply`), {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

/** PUT /api/v1/owner/review/{reviewId}/reply — 답글 수정 */
export function updateOwnerReviewReply(reviewId: number, content: string) {
  return apiV1Fetch<OwnerReviewReplyResultDto>(reviewPath(`/${reviewId}/reply`), {
    method: 'PUT',
    body: JSON.stringify({ content }),
  })
}

/** DELETE /api/v1/owner/review/{reviewId}/reply */
export function deleteOwnerReviewReply(reviewId: number) {
  return apiV1Fetch<null>(reviewPath(`/${reviewId}/reply`), { method: 'DELETE' })
}

/** POST /api/v1/owner/review/{reviewId}/insight — AI 리뷰 분석 */
export function createOwnerReviewInsight(reviewId: number) {
  return apiV1Fetch<OwnerReviewInsightDto>(reviewPath(`/${reviewId}/insight`), { method: 'POST' })
}
