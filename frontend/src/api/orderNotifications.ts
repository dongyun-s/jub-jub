/**
 * 주문 추적 알림 API (명세: jubjub 주문현황알림 API 차트 시트)
 * - GET /order-tracking/notifications
 * - POST /order-tracking/notifications/read-all
 *
 * `/orders` 와 동일하게 `/api/v1` 없이 apiFetch 사용
 */
import { apiFetch } from './authClient'

export interface OrderNotificationItem {
  id: string
  title: string
  body: string
  createdAt: string
  read: boolean
}

export interface OrderNotificationsPayload {
  unreadCount: number
  notifications: OrderNotificationItem[]
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

function normalizeItem(raw: unknown): OrderNotificationItem | null {
  if (typeof raw !== 'object' || raw === null) return null
  const p = raw as Record<string, unknown>
  const idRaw = p.id ?? p.notificationId ?? p.notification_id
  if (idRaw === undefined || idRaw === null) return null
  const title = String(p.title ?? p.subject ?? '').trim() || '알림'
  const body = String(p.body ?? p.message ?? p.content ?? '').trim()
  const createdRaw = p.createdAt ?? p.created_at ?? p.sentAt ?? p.sent_at ?? ''
  const createdAt = typeof createdRaw === 'string' ? createdRaw : ''
  const read =
    p.read === true ||
    p.read === 1 ||
    String(p.read).toLowerCase() === 'true' ||
    p.isRead === true ||
    p.is_read === true
  return {
    id: String(idRaw),
    title,
    body,
    createdAt,
    read,
  }
}

function parseListPayload(inner: unknown): OrderNotificationsPayload {
  if (inner == null) return { unreadCount: 0, notifications: [] }

  if (Array.isArray(inner)) {
    const notifications = inner.map(normalizeItem).filter(Boolean) as OrderNotificationItem[]
    const unreadCount = notifications.filter((n) => !n.read).length
    return { unreadCount, notifications }
  }

  if (typeof inner !== 'object') return { unreadCount: 0, notifications: [] }

  const o = inner as Record<string, unknown>
  const unreadFromApi = num(o.unreadCount ?? o.unread_count)

  const rawList =
    o.notifications ??
    o.items ??
    o.list ??
    o.results ??
    (Array.isArray(o.data) ? o.data : null)

  const arr = Array.isArray(rawList) ? rawList : []
  const notifications = arr.map(normalizeItem).filter(Boolean) as OrderNotificationItem[]

  const unreadCount =
    unreadFromApi !== undefined ? unreadFromApi : notifications.filter((n) => !n.read).length

  return { unreadCount, notifications }
}

/** GET /order-tracking/notifications */
export async function fetchOrderNotifications(): Promise<OrderNotificationsPayload> {
  const raw = await apiFetch<unknown>('/order-tracking/notifications', { method: 'GET' })
  const inner = unwrapEnvelope(raw)
  return parseListPayload(inner)
}

/** POST /order-tracking/notifications/read-all */
export async function postOrderNotificationsReadAll(): Promise<void> {
  await apiFetch<unknown>('/order-tracking/notifications/read-all', {
    method: 'POST',
  })
}
