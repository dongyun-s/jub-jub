import { useCallback, useState } from 'react'
import {
  fetchUnifiedNotifications,
  postUnifiedNotificationRead,
  postUnifiedNotificationsReadAll,
  type UnifiedNotificationItem,
  type UnifiedNotificationType,
} from '../api/notifications'
import { LIVE_API } from '../lib/liveApi'
import { getMockUnifiedNotifications } from '../lib/mocks/notifications'

export function useUnifiedNotifications() {
  const [items, setItems] = useState<UnifiedNotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMock, setIsMock] = useState(!LIVE_API.notifications)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (LIVE_API.notifications) {
        const data = await fetchUnifiedNotifications()
        setItems(data.notifications)
        setIsMock(false)
      } else {
        setItems(getMockUnifiedNotifications().notifications)
        setIsMock(true)
      }
    } catch {
      const mock = getMockUnifiedNotifications()
      setItems(mock.notifications)
      setIsMock(true)
      setError('알림을 불러오지 못했습니다. 데모 데이터를 표시합니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (item: UnifiedNotificationItem) => {
    if (item.read) return
    if (LIVE_API.notifications) {
      try {
        await postUnifiedNotificationRead(item.type, item.notificationId)
      } catch {
        setError('읽음 처리에 실패했습니다.')
        return
      }
    }
    setItems((prev) =>
      prev.map((n) => (n.id === item.id && !n.read ? { ...n, read: true } : n)),
    )
  }, [])

  const markAllRead = useCallback(async () => {
    if (LIVE_API.notifications) {
      await postUnifiedNotificationsReadAll()
      await load()
      return
    }
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [load])

  const unreadCount = items.filter((n) => !n.read).length

  return {
    items,
    unreadCount,
    loading,
    error,
    isMock,
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
