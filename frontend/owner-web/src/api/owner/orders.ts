import { apiV1Fetch } from '../authClient'
import { OWNER_API } from './paths'

/** GET /api/v1/owner/orders?status=… */
export type OwnerTrackingStatus =
  | 'RECEIVED'
  | 'COOKING'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'REJECTED'
  | string

export type OwnerOrderSummaryDto = {
  orderId: number
  orderNo: string
  customerNickname?: string
  orderStatus?: string
  trackingStatus: OwnerTrackingStatus
  totalQuantity?: number
  finalAmount: number
  orderedAt?: string
  paidAt?: string
}

export type OwnerOrderOptionDto = {
  optionId?: number
  menuOptionId?: number
  optionName: string
  additionalPrice?: number
}

export type OwnerOrderItemDto = {
  orderItemId?: number
  menuId?: number
  menuName: string
  menuPrice?: number
  quantity: number
  requestMemo?: string | null
  itemTotalAmount?: number
  options?: OwnerOrderOptionDto[]
}

export type OwnerOrderDetailDto = {
  orderId: number
  orderNo: string
  customerName?: string
  customerNickname?: string
  customerPhone?: string
  orderStatus?: string
  trackingStatus: OwnerTrackingStatus
  originalAmount?: number
  tierDiscountAmount?: number
  couponDiscountAmount?: number
  ecoDiscountAmount?: number
  finalAmount: number
  useMultiUseContainer?: boolean
  orderedAt?: string
  paidAt?: string
  estimatedPickupTime?: string | null
  items?: OwnerOrderItemDto[]
}

export type OwnerOrderActionResult = {
  orderId: number
  orderStatus: string
  trackingStatus: OwnerTrackingStatus
}

export type OwnerOrderListParams = {
  status?: OwnerTrackingStatus
}

function ordersPath(suffix = ''): string {
  return `${OWNER_API.orders}${suffix}`
}

/** GET /api/v1/owner/orders */
export function fetchOwnerOrders(params?: OwnerOrderListParams) {
  const q = new URLSearchParams()
  if (params?.status) q.set('status', params.status)
  const qs = q.toString()
  return apiV1Fetch<OwnerOrderSummaryDto[]>(`${ordersPath()}${qs ? `?${qs}` : ''}`, { method: 'GET' })
}

/** GET /api/v1/owner/orders/{orderId} */
export function fetchOwnerOrderDetail(orderId: number) {
  return apiV1Fetch<OwnerOrderDetailDto>(ordersPath(`/${orderId}`), { method: 'GET' })
}

/** PATCH …/accept — RECEIVED → COOKING */
export function acceptOwnerOrder(orderId: number) {
  return apiV1Fetch<OwnerOrderActionResult>(ordersPath(`/${orderId}/accept`), { method: 'PATCH' })
}

/** PATCH …/reject — reason 필수(최대 200자) */
export function rejectOwnerOrder(orderId: number, reason: string) {
  return apiV1Fetch<OwnerOrderActionResult>(ordersPath(`/${orderId}/reject`), {
    method: 'PATCH',
    body: JSON.stringify({ reason: reason.slice(0, 200) }),
  })
}

/** PATCH …/ready — COOKING → READY_FOR_PICKUP */
export function markOwnerOrderReady(orderId: number) {
  return apiV1Fetch<OwnerOrderActionResult>(ordersPath(`/${orderId}/ready`), { method: 'PATCH' })
}

/** PATCH …/complete — READY_FOR_PICKUP → PICKED_UP */
export function completeOwnerOrder(orderId: number) {
  return apiV1Fetch<OwnerOrderActionResult>(ordersPath(`/${orderId}/complete`), { method: 'PATCH' })
}
