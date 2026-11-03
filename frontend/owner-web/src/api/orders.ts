import { apiV1FetchPlain } from './authClient'

/**
 * @deprecated Owner 주문 API가 붙으면 `api/owner/orders.completeOwnerOrder` 사용
 * 레거시: POST /api/v1/orders/{orderId}/complete
 */
export async function completeOrderPickup(orderId: number): Promise<string> {
  return apiV1FetchPlain<string>(`/orders/${orderId}/complete`, { method: 'POST' })
}
