/**
 * 주문 API
 * - prefix 없음: /orders
 */
import { apiFetch } from './authClient'

export interface MyOrderItem {
  orderId: number
  orderNo: string
  storeName: string
  orderedAt: string
  orderStatus: string
  finalAmount: number
  paymentRecordId: number | null
  paymentStatus: string | null
  merchantUid: string | null
  paidAt: string | null
}

/** GET /orders/me */
export function getMyOrders() {
  return apiFetch<MyOrderItem[]>('/orders/me', { method: 'GET' })
}

