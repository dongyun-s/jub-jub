/**
 * 주문·결제 할인 API (/orders, /payments)
 * @see 주문·결제 할인 API 명세서
 */
import { apiFetch } from './authClient'

export type PaymentMethod = 'CARD' | 'EASY_PAY' | 'VBANK' | 'TRANSFER' | 'UNKNOWN'
export type OrderStatus = 'READY' | 'PAID' | 'COMPLETED' | 'REFUNDED' | 'FAILED'
export type PaymentStatus = 'READY' | 'PAID' | 'REFUNDED' | 'FAILED'

/** POST /orders */
export interface CreateOrderBody {
  storeId: number
  /** 할인 전 장바구니 총액 */
  totalAmount: number
  memberCouponIds?: number[] | null
  useMultiUseContainer?: boolean
}

/** POST /orders 응답 */
export interface OrderResponse {
  orderId: number
  orderNo: string
  orderStatus: OrderStatus
  originalAmount: number
  tierDiscountAmount: number
  couponDiscountAmount: number
  ecoDiscountAmount: number
  /** 실제 결제해야 하는 금액 */
  finalAmount: number
  useMultiUseContainer: boolean
  usedCouponIds: number[]
  paymentId: number | null
  /** 백엔드 확장 필드 */
  memberProfileId?: number
  storeId?: number
}

/** POST /payments/prepare */
export interface PreparePaymentBody {
  orderId: number
  method: PaymentMethod
}

/** POST /payments/prepare 응답 */
export interface PreparePaymentResponse {
  paymentRecordId: number
  orderId: number
  merchantUid: string
  paymentStatus: PaymentStatus
  /** PortOne 결제 금액 */
  requestedAmount: number
  /** 백엔드 확장 (PortOne paymentId = merchantUid) */
  paymentId?: string
  pgProvider?: string
  method?: PaymentMethod
}

/** POST /payments/confirm */
export interface ConfirmPaymentBody {
  merchantUid: string
  transactionId: string
  userLatitude: number
  userLongitude: number
}

/** POST /payments/confirm 응답 */
export interface PaymentResponse {
  paymentRecordId: number
  orderId: number
  merchantUid: string
  transactionId: string | null
  pgProvider: string
  method: PaymentMethod
  paymentStatus: PaymentStatus
  requestedAmount: number
  paidAmount: number | null
  paidAt: string | null
}

/** POST /payments/{paymentRecordId}/refund */
export interface RefundPaymentBody {
  amount: number
  reason: string
}

export interface RefundPaymentResponse {
  refundId: number
  paymentId: number
  refundStatus: string
  refundAmount: number
  refundedAt: string
}

export function createOrder(body: CreateOrderBody) {
  return apiFetch<OrderResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      ...body,
      memberCouponIds: body.memberCouponIds ?? [],
    }),
  })
}

export function preparePayment(body: PreparePaymentBody) {
  return apiFetch<PreparePaymentResponse>('/payments/prepare', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function confirmPayment(body: ConfirmPaymentBody) {
  return apiFetch<PaymentResponse>('/payments/confirm', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function refundPayment(paymentRecordId: number, body: RefundPaymentBody) {
  return apiFetch<RefundPaymentResponse>(`/payments/${paymentRecordId}/refund`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
