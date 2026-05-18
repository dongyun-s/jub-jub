import { useCallback, useEffect, useState } from 'react'
import { fetchOrderNotifications } from '../api/orderNotifications'
import { getAccessToken } from '../lib/authStorage'

/** 주문·픽업 알림 미읽음 개수 (헤더 배지용) */
export function useUnreadNotificationCount() {
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!getAccessToken()) {
      setUnreadCount(0)
      return
    }
    try {
      const data = await fetchOrderNotifications()
      setUnreadCount(Math.max(0, data.unreadCount))
    } catch {
      setUnreadCount(0)
    }
  }, [])

  useEffect(() => {
    void refresh()

    const onFocus = () => void refresh()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    const onUpdated = () => void refresh()

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('jubjub-notifications-updated', onUpdated)
    const intervalId = window.setInterval(() => void refresh(), 60_000)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('jubjub-notifications-updated', onUpdated)
      window.clearInterval(intervalId)
    }
  }, [refresh])

  return unreadCount
}

export function notifyNotificationsUpdated() {
  window.dispatchEvent(new Event('jubjub-notifications-updated'))
}
