/**
 * 주문 API
 * - prefix 없음: /orders
 */
import { apiFetch, apiV1FetchPlain } from './authClient'
import { withAuthRetry } from '../lib/withAuthRetry'

/** GET /orders/me 항목 (주문·결제 할인 API 명세) */
export interface MyOrderItem {
  orderId: number
  orderNo: string
  storeName: string
  /** 구버전 서버 호환: 없을 수 있음 */
  storeId?: number
  orderedAt: string
  /** READY | PAID | COMPLETED | REFUNDED | FAILED */
  orderStatus: string
  originalAmount?: number
  tierDiscountAmount?: number
  couponDiscountAmount?: number
  ecoDiscountAmount?: number
  finalAmount: number
  useMultiUseContainer?: boolean
  usedCouponIds?: number[]
  paymentRecordId: number | null
  paymentStatus: string | null
  merchantUid: string | null
  paidAt: string | null
}

/** GET /orders/me */
export function getMyOrders() {
  return apiFetch<MyOrderItem[]>('/orders/me', { method: 'GET' })
}

/** POST /api/v1/orders/{orderId}/complete 요청 본문 (배포 서버 OpenAPI 기준) */
export interface CompletePickupRequest {
  userLatitude: number
  userLongitude: number
}

/** POST /api/v1/orders/{orderId}/complete — 픽업 완료·리워드(주문 횟수) 반영 */
export function completeOrderPickup(orderId: number, body: CompletePickupRequest) {
  return withAuthRetry(() =>
    apiV1FetchPlain<string>(`/orders/${orderId}/complete`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  )
}

