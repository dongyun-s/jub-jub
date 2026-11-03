import { useCallback, useState } from 'react'
import {
  fetchUnifiedNotifications,
  postUnifiedNotificationRead,
  postUnifiedNotificationsReadAll,
  type UnifiedNotificationItem,
  type UnifiedNotificationType,
} from '../api/notifications'

export function useUnifiedNotifications() {
  const [items, setItems] = useState<UnifiedNotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchUnifiedNotifications()
      setItems(data.notifications)
    } catch {
      setItems([])
      setError('알림을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (item: UnifiedNotificationItem) => {
    if (item.read) return
    try {
      await postUnifiedNotificationRead(item.type, item.notificationId)
    } catch {
      setError('읽음 처리에 실패했습니다.')
      return
    }
    setItems((prev) =>
      prev.map((n) => (n.id === item.id && !n.read ? { ...n, read: true } : n)),
    )
  }, [])

  const markAllRead = useCallback(async () => {
    await postUnifiedNotificationsReadAll()
    await load()
  }, [load])

  const unreadCount = items.filter((n) => !n.read).length

  return {
    items,
    unreadCount,
    loading,
    error,
    load,
    markAsRead,
    markAllRead,
  }
}

export function notificationTypeLabel(type: UnifiedNotificationType): string {
  switch (type) {
    case 'REVIEW_REQUEST':
      return '리뷰'
    case 'COUPON_ISSUED':
      return '쿠폰 지급'
    case 'COUPON_EXPIRING':
      return '쿠폰 만료'
    default:
      return '주문'
  }
}
