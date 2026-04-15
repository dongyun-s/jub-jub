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
}

export interface OrderResponse {
  orderId: number
  orderNo: string
  memberProfileId: number
  storeId: number
  orderStatus: string
  finalAmount: number
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
