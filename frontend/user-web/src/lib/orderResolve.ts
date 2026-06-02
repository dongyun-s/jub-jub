/**
 * 주문 현황 화면용 — orderId 로 주문 행 resolve
 */
import { getMyOrders, isActivePickupOrder, isPaidOrderForHistory, type MyOrderItem } from '../api/orders'
import { getAccessToken } from './authStorage'

const LOCAL_ORDERS_KEY = '__jubjub_local_orders'

/** 결제 직후 API 동기화 지연 시에만 로컬-only 주문을 잠깐 노출 */
export const LOCAL_ORDER_SYNC_GRACE_MS = 3 * 60 * 1000

export type OrderContextRow = {
  orderId: number
  storeId: number
  storeName: string
  menuSummary?: string
  orderStatus?: string
  paymentStatus?: string
  pickupCompleted?: boolean
  createdAt?: string
  paidAt?: string | null
  finalAmount?: number
  totalAmount?: number
  image?: string | null
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

function isLocalOrderPaid(o: OrderContextRow): boolean {
  if (o.paymentStatus === 'PAID') return true
  if (o.orderStatus === 'PAID' || o.orderStatus === 'COMPLETED') return true
  if (o.paidAt != null && String(o.paidAt).trim() !== '') return true
  return false
}

function isPickupPending(o: OrderContextRow): boolean {
  if (o.pickupCompleted || o.orderStatus === 'COMPLETED') return false
  return isLocalOrderPaid(o)
}

/** 결제 미완료·테스트 잔여 로컬 주문 제거 */
export function pruneUnpaidLocalOrders(): void {
  if (typeof window === 'undefined') return
  try {
    const parsed = readLocalOrders()
    const paidOnly = parsed.filter(isLocalOrderPaid)
    if (paidOnly.length !== parsed.length) {
      window.localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(paidOnly))
    }
  } catch {
    /* ignore */
  }
}

function isRecentLocalOrder(o: OrderContextRow, graceMs = LOCAL_ORDER_SYNC_GRACE_MS): boolean {
  if (!o.createdAt) return false
  const t = new Date(o.createdAt).getTime()
  return !Number.isNaN(t) && Date.now() - t <= graceMs
}

/**
 * 서버 GET /orders/me 성공 후: 서버에 없는 오래된 로컬 주문(데모·테스트 잔여) 제거.
 * 방금 결제한 주문만 grace 구간 동안 로컬에 유지.
 */
export function syncLocalOrdersWithApiList(apiOrders: MyOrderItem[]): void {
  if (typeof window === 'undefined') return
  try {
    const apiIds = new Set(apiOrders.map((o) => o.orderId))
    const kept = readLocalOrders().filter((lo) => {
      if (!isLocalOrderPaid(lo)) return false
      if (apiIds.has(lo.orderId)) return true
      return isRecentLocalOrder(lo)
    })
    window.localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(kept))
    window.dispatchEvent(new Event('jubjub:orders-updated'))
  } catch {
    /* ignore */
  }
}

/** 로그인 상태에서 주문내역에 붙일 로컬-only 행(방금 결제, 서버 미반영) */
export function readLocalOrdersPendingApiSync(apiOrderIds: Set<number>): OrderContextRow[] {
  pruneUnpaidLocalOrders()
  return readLocalOrders().filter(
    (lo) =>
      isLocalOrderPaid(lo) &&
      !apiOrderIds.has(lo.orderId) &&
      isRecentLocalOrder(lo),
  )
}

function mapApiOrderToContext(hit: MyOrderItem, localMatch?: OrderContextRow): OrderContextRow {
  return {
    orderId: hit.orderId,
    storeId: hit.storeId ?? localMatch?.storeId ?? 0,
    storeName: hit.storeName,
    menuSummary: localMatch?.menuSummary ?? hit.orderNo,
    orderStatus: hit.orderStatus,
    paymentStatus: hit.paymentStatus ?? undefined,
    pickupCompleted: hit.orderStatus === 'COMPLETED',
    createdAt: localMatch?.createdAt ?? hit.orderedAt,
    paidAt: hit.paidAt ?? localMatch?.paidAt,
  }
}

function pickNewestActivePickup(orders: MyOrderItem[]): MyOrderItem | undefined {
  const pending = orders.filter(isActivePickupOrder)
  if (pending.length === 0) return undefined
  return [...pending].sort((a, b) => {
    const ta = new Date(a.orderedAt).getTime()
    const tb = new Date(b.orderedAt).getTime()
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta)
  })[0]
}

export function getActivePaidOrderFromLocal(): OrderContextRow | null {
  pruneUnpaidLocalOrders()
  const paid = readLocalOrders().filter((o) => o?.orderId && isPickupPending(o))
  if (paid.length === 0) return null
  return [...paid].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return tb - ta
  })[0] ?? null
}

export async function resolveOrderById(orderId: number): Promise<OrderContextRow | null> {
  if (getAccessToken()) {
    try {
      const list = await getMyOrders()
      const hit = Array.isArray(list) ? list.find((o) => o.orderId === orderId) : undefined
      if (hit && isPaidOrderForHistory(hit)) {
        const localMatch = readLocalOrders().find((lo) => lo.orderId === hit.orderId)
        return mapApiOrderToContext(hit, localMatch)
      }
      if (hit && !isPaidOrderForHistory(hit)) return null
    } catch {
      /* API 실패 시 로컬 fallback */
    }
  }

  const local = readLocalOrders().find((o) => o.orderId === orderId && isPickupPending(o))
  return local ?? null
}

export async function resolveActivePaidOrder(): Promise<OrderContextRow | null> {
  pruneUnpaidLocalOrders()

  if (getAccessToken()) {
    try {
      const list = await getMyOrders()
      const rows = Array.isArray(list) ? list : []
      syncLocalOrdersWithApiList(rows)
      const paid = pickNewestActivePickup(rows)
      if (paid) {
        return resolveOrderById(paid.orderId)
      }
      return null
    } catch {
      return null
    }
  }
  return getActivePaidOrderFromLocal()
}
