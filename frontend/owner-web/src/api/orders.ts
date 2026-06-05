import { apiV1FetchPlain } from './authClient'

/** POST /api/v1/orders/{orderId}/complete — 픽업 완료 처리 */
export async function completeOrderPickup(orderId: number): Promise<string> {
  return apiV1FetchPlain<string>(`/orders/${orderId}/complete`, { method: 'POST' })
}
