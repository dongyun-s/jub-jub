/**
 * 주문 추적 API — GET /order-tracking/{orderId}
 * 출발 추천 — GET /order-tracking/{orderId}/departure-recommendation
 */
import { apiFetch } from './authClient'

export type OrderTrackingStatus =
  | 'RECEIVED'
  | 'COOKING'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'REJECTED'

export interface OrderTrackingResponse {
  orderId: number
  orderNo: string
  paymentOrderStatus: string
  trackingStatus: OrderTrackingStatus | null
  finalAmount: number
  orderedAt: string
  paidAt: string | null
  estimatedPickupTime: string | null
  storeName: string
  storeAddress: string
  storeLatitude: number | null
  storeLongitude: number | null
  rejectReason?: string | null
}

/** GET …/departure-recommendation 성공 응답 */
export interface DepartureRecommendationResponse {
  orderId: number
  estimatedPickupTime: string | null
  walkingMinutes: number
  minutesUntilDeparture: number
  recommendedDepartureAt: string | null
  expectedArrivalAt: string | null
  leaveNow: boolean
}

export type OrderStep = 'received' | 'cooking' | 'ready' | 'completed' | 'rejected'

/** GET /order-tracking/{orderId} */
export function fetchOrderTracking(orderId: number) {
  return apiFetch<OrderTrackingResponse>(`/order-tracking/${orderId}`, { method: 'GET' })
}

/**
 * GET /order-tracking/{orderId}/departure-recommendation?userLat=&userLng=
 * (/api/v1 접두사 없음)
 */
export function fetchDepartureRecommendation(orderId: number, userLat: number, userLng: number) {
  const q = new URLSearchParams({
    userLat: String(userLat),
    userLng: String(userLng),
  })
  return apiFetch<DepartureRecommendationResponse>(
    `/order-tracking/${orderId}/departure-recommendation?${q.toString()}`,
    { method: 'GET' },
  )
}

export function mapTrackingToOrderStep(
  tracking: OrderTrackingStatus | null | undefined,
  paymentOrderStatus?: string | null,
): OrderStep {
  const pay = paymentOrderStatus?.trim().toUpperCase()
  if (pay === 'REFUNDED' || pay === 'CANCELLED' || pay === 'CANCELED') return 'rejected'
  if (tracking === 'REJECTED') return 'rejected'
  if (pay === 'COMPLETED') return 'completed'
  if (tracking === 'PICKED_UP') return 'completed'
  if (tracking === 'READY_FOR_PICKUP') return 'ready'
  if (tracking === 'COOKING') return 'cooking'
  return 'received'
}

/** 사장님 수락 이후·픽업 전 — 주문현황·픽업 경로 노출 (픽업완료 제외) */
export function isAcceptedTracking(tracking: OrderTrackingStatus | null | undefined): boolean {
  return tracking === 'COOKING' || tracking === 'READY_FOR_PICKUP'
}

/** 픽업 완료(경로·현황 배너 종료) */
export function isPickupCompletedTracking(
  tracking: OrderTrackingStatus | null | undefined,
  paymentOrderStatus?: string | null,
): boolean {
  const pay = paymentOrderStatus?.trim().toUpperCase()
  if (pay === 'COMPLETED') return true
  return tracking === 'PICKED_UP'
}

export function isRejectedTracking(
  tracking: OrderTrackingStatus | null | undefined,
  paymentOrderStatus?: string | null,
): boolean {
  const pay = paymentOrderStatus?.trim().toUpperCase()
  if (pay === 'REFUNDED' || pay === 'CANCELLED' || pay === 'CANCELED') return true
  return tracking === 'REJECTED'
}

/** 결제 후 매장 수락 대기 */
export function isWaitingAcceptTracking(
  tracking: OrderTrackingStatus | null | undefined,
  paymentOrderStatus?: string | null,
): boolean {
  if (isRejectedTracking(tracking, paymentOrderStatus)) return false
  if (isPickupCompletedTracking(tracking, paymentOrderStatus)) return false
  if (isAcceptedTracking(tracking)) return false
  return tracking == null || tracking === 'RECEIVED'
}
