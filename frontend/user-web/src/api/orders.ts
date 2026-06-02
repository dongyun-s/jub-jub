/**
 * 주문 API
 * @see 주문·결제 할인 API 명세서 — GET /orders/me
 */
import { apiFetch, apiV1FetchPlain } from './authClient'
import type { OrderStatus, PaymentStatus } from './payment'
import { withAuthRetry } from '../lib/withAuthRetry'

export interface MyOrderLineOption {
  orderItemOptionId: number
  menuOptionId: number
  optionName: string
  additionalPrice: number
}

export interface MyOrderLineItem {
  orderItemId: number
  menuId: number
  menuName: string
  menuPrice: number
  quantity: number
  requestMemo?: string | null
  itemTotalAmount: number
  options: MyOrderLineOption[]
}

/** GET /orders/me 항목 */
export interface MyOrderItem {
  orderId: number
  orderNo: string
  storeName: string
  orderedAt: string
  orderStatus: OrderStatus
  originalAmount: number
  tierDiscountAmount: number
  couponDiscountAmount: number
  ecoDiscountAmount: number
  finalAmount: number
  useMultiUseContainer: boolean
  usedCouponIds: number[]
  pickupDistanceMeters?: number | null
  items?: MyOrderLineItem[]
  paymentRecordId: number | null
  paymentStatus: PaymentStatus | null
  merchantUid: string | null
  paidAt: string | null
  /** 구버전·확장 */
  storeId?: number
}

export function getMyOrders() {
  return apiFetch<MyOrderItem[]>('/orders/me', { method: 'GET' })
}

/** 주문내역·리뷰 대상 — 결제 완료(또는 픽업 완료)만 노출 */
export function isPaidOrderForHistory(
  o: Pick<MyOrderItem, 'orderStatus' | 'paymentStatus' | 'paidAt'>,
): boolean {
  if (o.paymentStatus === 'PAID') return true
  if (o.orderStatus === 'PAID' || o.orderStatus === 'COMPLETED') return true
  if (o.paidAt != null && String(o.paidAt).trim() !== '') return true
  return false
}

/** 홈 배너·지도 픽업 — 결제 완료했고 아직 픽업 전인 주문만 */
export function isActivePickupOrder(
  o: Pick<MyOrderItem, 'orderStatus' | 'paymentStatus' | 'paidAt'>,
): boolean {
  if (!isPaidOrderForHistory(o)) return false
  if (o.orderStatus === 'COMPLETED') return false
  return true
}

/** POST /api/v1/orders/{orderId}/complete — 픽업 완료 (결제 시 저장된 좌표·거리 사용) */
export function completeOrderPickup(orderId: number) {
  return withAuthRetry(() =>
    apiV1FetchPlain<string>(`/orders/${orderId}/complete`, {
      method: 'POST',
    }),
  )
}

export function formatPickupDistance(meters: number | null | undefined): string {
  if (meters == null || meters <= 0) return ''
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`
  return `${meters}m`
}

export function formatOrderMenuSummary(o: Pick<MyOrderItem, 'orderNo' | 'items'>): string {
  const items = o.items
  if (items && items.length > 0) {
    if (items.length === 1) return items[0].menuName
    return `${items[0].menuName} 외 ${items.length - 1}건`
  }
  return o.orderNo
}
