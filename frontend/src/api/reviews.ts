/**
 * 리뷰 API — `/api/reviews/*` (Vite `/api` 프록시·직접 호출 공통)
 */
import { apiFetch } from './authClient'

/** 주문내역·주문현황에서 리뷰 작성 화면으로 넘길 맥락 */
export interface ReviewWritePayload {
  storeName: string
  orderId: number
  storeId: number
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

export function getReview(reviewId: number) {
  return apiFetch<ReviewDto>(`/api/reviews/${reviewId}`, { method: 'GET' })
}

export function fetchStoreReviews(storeId: number) {
  return apiFetch<ReviewDto[]>(`/api/reviews/store/${storeId}`, { method: 'GET' })
}

export function fetchStoreReviewsByTasteRating(storeId: number, rating: number) {
  const q = new URLSearchParams({ rating: String(rating) })
  return apiFetch<ReviewDto[]>(`/api/reviews/store/${storeId}/taste-rating?${q}`, { method: 'GET' })
}

export function fetchMyReviews(memberProfileId: number) {
  return apiFetch<ReviewDto[]>(`/api/reviews/my/${memberProfileId}`, { method: 'GET' })
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
