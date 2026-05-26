/**
 * 통합 알림 API — GET/POST /notifications
 * (주문 추적 + 리뷰 요청 + 쿠폰 지급/만료 — 쿠폰 타입은 백엔드 예정)
 */
import { apiFetch } from './authClient'

export type UnifiedNotificationType =
  | 'ORDER_TRACKING'
  | 'REVIEW_REQUEST'
  | 'COUPON_ISSUED'
  | 'COUPON_EXPIRING'

export interface UnifiedNotificationItem {
  id: string
  type: UnifiedNotificationType
  notificationId: number
  orderId?: number
  storeId?: number
  couponId?: number
  couponAmount?: number
  title: string
  body: string
  createdAt: string
  read: boolean
}

export interface UnifiedNotificationsPayload {
  unreadCount: number
  notifications: UnifiedNotificationItem[]
}

function unwrapEnvelope(body: unknown): unknown {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return body
  const o = body as Record<string, unknown>
  if (o.success === true && Object.prototype.hasOwnProperty.call(o, 'data')) return o.data
  return body
}

function num(v: unknown): number | undefined {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (!Number.isNaN(n)) return n
  }
  return undefined
}

function normalizeType(raw: unknown): UnifiedNotificationType | null {
  const t = String(raw ?? '')
    .trim()
    .toUpperCase()
  if (t === 'ORDER_TRACKING') return 'ORDER_TRACKING'
  if (t === 'REVIEW_REQUEST') return 'REVIEW_REQUEST'
  if (t === 'COUPON_ISSUED') return 'COUPON_ISSUED'
  if (t === 'COUPON_EXPIRING' || t === 'COUPON_EXPIRED') return 'COUPON_EXPIRING'
  return null
}

function normalizeItem(raw: unknown): UnifiedNotificationItem | null {
  if (typeof raw !== 'object' || raw === null) return null
  const p = raw as Record<string, unknown>
  const type = normalizeType(p.type)
  const notificationId = num(p.notificationId ?? p.notification_id)
  if (!type || notificationId == null) return null

  const title = String(p.title ?? '').trim() || '알림'
  const body = String(p.message ?? p.body ?? p.content ?? '').trim()
  const createdRaw = p.createdAt ?? p.created_at ?? ''
  const createdAt = typeof createdRaw === 'string' ? createdRaw : String(createdRaw ?? '')

  const read =
    p.read === true ||
    p.read === 1 ||
    String(p.read).toLowerCase() === 'true' ||
    p.isRead === true ||
    p.is_read === true

  return {
    id: `${type}-${notificationId}`,
    type,
    notificationId,
    orderId: num(p.orderId ?? p.order_id),
    storeId: num(p.storeId ?? p.store_id),
    couponId: num(p.couponId ?? p.coupon_id),
    couponAmount: num(p.couponAmount ?? p.coupon_amount ?? p.amount),
    title,
    body,
    createdAt,
    read,
  }
}

function parseListPayload(inner: unknown): UnifiedNotificationsPayload {
  if (inner == null) return { unreadCount: 0, notifications: [] }

  if (Array.isArray(inner)) {
    const notifications = inner.map(normalizeItem).filter(Boolean) as UnifiedNotificationItem[]
    return {
      unreadCount: notifications.filter((n) => !n.read).length,
      notifications,
    }
  }

  if (typeof inner !== 'object') return { unreadCount: 0, notifications: [] }

  const o = inner as Record<string, unknown>
  const unreadFromApi = num(o.unreadCount ?? o.unread_count)
  const rawList = o.notifications ?? o.items ?? o.list
  const arr = Array.isArray(rawList) ? rawList : []
  const notifications = arr.map(normalizeItem).filter(Boolean) as UnifiedNotificationItem[]

  return {
    unreadCount:
      unreadFromApi !== undefined ? unreadFromApi : notifications.filter((n) => !n.read).length,
    notifications,
  }
}

/** GET /notifications */
export async function fetchUnifiedNotifications(): Promise<UnifiedNotificationsPayload> {
  const raw = await apiFetch<unknown>('/notifications', { method: 'GET' })
  return parseListPayload(unwrapEnvelope(raw))
}

/** POST /notifications/read-all */
export async function postUnifiedNotificationsReadAll(): Promise<void> {
  await apiFetch<unknown>('/notifications/read-all', { method: 'POST' })
}

/** POST /notifications/{type}/{notificationId}/read */
export async function postUnifiedNotificationRead(
  type: UnifiedNotificationType,
  notificationId: number,
): Promise<void> {
  await apiFetch<unknown>(`/notifications/${type}/${notificationId}/read`, {
    method: 'POST',
  })
}
