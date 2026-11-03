/**
 * 리뷰 작성 요청 알림 API
 * - GET /review-notifications
 * - POST /review-notifications/read-all
 * - POST /review-notifications/{notificationId}/read
 */
import { apiFetch } from './authClient'

export interface ReviewNotificationItem {
  notificationId: number
  orderId: number
  storeId: number
  title: string
  message: string
  read: boolean
  createdAt: string
}

export interface ReviewNotificationsPayload {
  unreadCount: number
  notifications: ReviewNotificationItem[]
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

function normalizeItem(raw: unknown): ReviewNotificationItem | null {
  if (typeof raw !== 'object' || raw === null) return null
  const p = raw as Record<string, unknown>
  const notificationId = num(p.notificationId ?? p.notification_id ?? p.id)
  const orderId = num(p.orderId ?? p.order_id)
  const storeId = num(p.storeId ?? p.store_id)
  if (notificationId == null || orderId == null || storeId == null) return null

  const read =
    p.read === true ||
    p.read === 1 ||
    String(p.read).toLowerCase() === 'true' ||
    p.isRead === true ||
    p.is_read === true

  const createdRaw = p.createdAt ?? p.created_at ?? ''
  const createdAt = typeof createdRaw === 'string' ? createdRaw : ''

  return {
    notificationId,
    orderId,
    storeId,
    title: String(p.title ?? '').trim() || '리뷰 작성',
    message: String(p.message ?? '').trim(),
    read,
    createdAt,
  }
}

function parseListPayload(inner: unknown): ReviewNotificationsPayload {
  if (inner == null) return { unreadCount: 0, notifications: [] }

  if (typeof inner !== 'object' || Array.isArray(inner)) {
    if (Array.isArray(inner)) {
      const notifications = inner.map(normalizeItem).filter(Boolean) as ReviewNotificationItem[]
      return {
        unreadCount: notifications.filter((n) => !n.read).length,
        notifications,
      }
    }
    return { unreadCount: 0, notifications: [] }
  }

  const o = inner as Record<string, unknown>
  const unreadFromApi = num(o.unreadCount ?? o.unread_count)
  const rawList = o.notifications ?? o.items ?? o.list
  const arr = Array.isArray(rawList) ? rawList : []
  const notifications = arr.map(normalizeItem).filter(Boolean) as ReviewNotificationItem[]

  const unreadCount =
    unreadFromApi !== undefined ? unreadFromApi : notifications.filter((n) => !n.read).length

  return { unreadCount, notifications }
}

/** GET /review-notifications */
export async function fetchReviewNotifications(): Promise<ReviewNotificationsPayload> {
  const raw = await apiFetch<unknown>('/review-notifications', { method: 'GET' })
  const inner = unwrapEnvelope(raw)
  return parseListPayload(inner)
}

/** POST /review-notifications/read-all */
export async function postReviewNotificationsReadAll(): Promise<void> {
  await apiFetch<unknown>('/review-notifications/read-all', { method: 'POST' })
}

/** POST /review-notifications/{notificationId}/read */
export async function postReviewNotificationRead(notificationId: number): Promise<void> {
  await apiFetch<unknown>(`/review-notifications/${notificationId}/read`, { method: 'POST' })
}
