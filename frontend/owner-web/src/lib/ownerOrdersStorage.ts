/**
 * 사장님 POS 주문 보드 — 브라우저 로컬 저장 (프론트 전용)
 */

import { MOCK_OWNER_ORDERS, type MockOwnerOrder } from './mocks/ownerMockData'

const storageKey = (storeId: number) => `jubjub_owner_orders_${storeId}`

export function readOwnerOrders(storeId: number): MockOwnerOrder[] {
  if (typeof window === 'undefined') return cloneSeed()
  try {
    const raw = window.localStorage.getItem(storageKey(storeId))
    if (!raw) return cloneSeed()
    const parsed = JSON.parse(raw) as MockOwnerOrder[]
    if (!Array.isArray(parsed) || parsed.length === 0) return cloneSeed()
    return parsed
  } catch {
    return cloneSeed()
  }
}

export function writeOwnerOrders(storeId: number, orders: MockOwnerOrder[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey(storeId), JSON.stringify(orders))
  } catch {
    /* quota 등 무시 */
  }
}

function cloneSeed(): MockOwnerOrder[] {
  return MOCK_OWNER_ORDERS.map((o) => ({
    ...o,
    items: o.items.map((i) => ({ ...i })),
    acceptedAtMs: o.acceptedAtMs,
  }))
}

export function resetOwnerOrders(storeId: number): MockOwnerOrder[] {
  const next = cloneSeed()
  writeOwnerOrders(storeId, next)
  return next
}
