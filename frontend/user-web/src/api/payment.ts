/**
 * 주문/결제 API
 * - 주문: /orders
 * - 결제: /payments
 *
 * (주의) 이 API들은 /api/v1 prefix가 아니라서 apiFetch 사용
 */
import { apiFetch } from './authClient'

export type PaymentMethod = 'CARD' | 'EASY_PAY' | 'VBANK' | 'TRANSFER' | 'UNKNOWN'

export interface CreateOrderBody {
  storeId: number
  totalAmount: number
  /** 사용할 회원 쿠폰 ID 목록 (명세: memberCouponIds) */
  memberCouponIds?: number[]
  /** 다회용기 포장 선택 — 할인 금액은 서버에서 적용 */
  useMultiUseContainer?: boolean
}

/** POST /orders 응답 (주문·결제 할인 API 명세) */
export interface OrderResponse {
  orderId: number
  orderNo: string
  memberProfileId: number
  storeId: number
  /** READY | PAID | COMPLETED | REFUNDED | FAILED */
  orderStatus: string
  originalAmount: number
  tierDiscountAmount: number
  couponDiscountAmount: number
  ecoDiscountAmount: number
  finalAmount: number
  useMultiUseContainer: boolean
  usedCouponIds: number[]
  paymentId: number | null
}

export interface PreparePaymentBody {
  orderId: number
  method: PaymentMethod
}

export interface PreparePaymentResponse {
  paymentRecordId: number
  orderId: number
  merchantUid: string
  paymentId: string
  pgProvider: string
  method: PaymentMethod
  paymentStatus: string
  requestedAmount: number
}

export interface ConfirmPaymentBody {
  /** 백엔드 ConfirmPaymentRequest 기준 */
  merchantUid: string
  transactionId: string
}

export interface PaymentResponse {
  paymentRecordId: number
  orderId: number
  merchantUid: string
  transactionId: string | null
  pgProvider: string
  method: PaymentMethod
  paymentStatus: string
  requestedAmount: number
  paidAmount: number | null
  paidAt: string | null
}

export function createOrder(body: CreateOrderBody) {
  return apiFetch<OrderResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify(body),
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
