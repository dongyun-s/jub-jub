/**
 * 주문 현황 화면용 — orderId 로 주문 행 resolve
 */
import { getMyOrders } from '../api/orders'
import { getAccessToken } from './authStorage'
const LOCAL_ORDERS_KEY = '__jubjub_local_orders'

export type OrderContextRow = {
  orderId: number
  storeId: number
  storeName: string
  menuSummary?: string
  orderStatus?: string
  paymentStatus?: string
  pickupCompleted?: boolean
  createdAt?: string
}

function readLocalOrders(): OrderContextRow[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_ORDERS_KEY)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(arr) ? (arr as OrderContextRow[]) : []
  } catch {
    return []
  }
}

function isPickupPending(o: OrderContextRow): boolean {
  if (o.pickupCompleted || o.orderStatus === 'COMPLETED') return false
  if (o.orderStatus === 'PAID') return true
  return o.paymentStatus === 'PAID'
}

export function getActivePaidOrderFromLocal(): OrderContextRow | null {
  const paid = readLocalOrders().filter((o) => o?.orderId && isPickupPending(o))
  return paid[0] ?? null
}

export async function resolveOrderById(orderId: number): Promise<OrderContextRow | null> {
  const local = readLocalOrders().find((o) => o.orderId === orderId)
  if (local) return local

  if (!getAccessToken()) return null
  try {
    const list = await getMyOrders()
    const hit = Array.isArray(list) ? list.find((o) => o.orderId === orderId) : undefined
    if (!hit) return null
    const localMatch = readLocalOrders().find((lo) => lo.orderId === hit.orderId)
    return {
      orderId: hit.orderId,
      storeId: hit.storeId ?? localMatch?.storeId ?? 0,
      storeName: hit.storeName,
      menuSummary: localMatch?.menuSummary ?? hit.orderNo,
      orderStatus: hit.orderStatus,
      paymentStatus: hit.paymentStatus ?? undefined,
      pickupCompleted: hit.orderStatus === 'COMPLETED',
      createdAt: localMatch?.createdAt ?? hit.orderedAt,
    }
  } catch {
    return null
  }
}

export async function resolveActivePaidOrder(): Promise<OrderContextRow | null> {
  const local = getActivePaidOrderFromLocal()
  if (local) return local
  if (!getAccessToken()) return null
  try {
    const list = await getMyOrders()
    const paid = Array.isArray(list) ? list.find((o) => o.orderStatus === 'PAID') : undefined
    if (!paid) return null
    return resolveOrderById(paid.orderId)
  } catch {
    return null
  }
}
