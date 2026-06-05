/**
 * 주문 추적 API — GET /order-tracking/{orderId}
 */
import { apiFetch } from './authClient'

export type OrderTrackingStatus =
  | 'RECEIVED'
  | 'COOKING'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'

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
}

export type OrderStep = 'received' | 'cooking' | 'ready' | 'completed'

/** GET /order-tracking/{orderId} */
export function fetchOrderTracking(orderId: number) {
  return apiFetch<OrderTrackingResponse>(`/order-tracking/${orderId}`, { method: 'GET' })
}

export function mapTrackingToOrderStep(
  tracking: OrderTrackingStatus | null | undefined,
  paymentOrderStatus?: string | null,
): OrderStep {
  if (paymentOrderStatus === 'COMPLETED') return 'completed'
  if (tracking === 'PICKED_UP') return 'completed'
  if (tracking === 'READY_FOR_PICKUP') return 'ready'
  if (tracking === 'COOKING') return 'cooking'
  return 'received'
}
