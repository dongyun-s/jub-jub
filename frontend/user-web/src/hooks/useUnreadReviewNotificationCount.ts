import { useCallback, useEffect, useState } from 'react'
import { fetchReviewNotifications } from '../api/reviewNotifications'
import { getAccessToken } from '../lib/authStorage'

/** 리뷰 작성 요청 알림 미읽음 개수 (마이페이지 NEW 배지용) */
export function useUnreadReviewNotificationCount() {
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!getAccessToken()) {
      setUnreadCount(0)
      return
    }
    try {
      const data = await fetchReviewNotifications()
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
    window.addEventListener('jubjub-review-notifications-updated', onUpdated)
    const intervalId = window.setInterval(() => void refresh(), 60_000)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('jubjub-review-notifications-updated', onUpdated)
      window.clearInterval(intervalId)
    }
  }, [refresh])

  return unreadCount
}

export function notifyReviewNotificationsUpdated() {
  window.dispatchEvent(new Event('jubjub-review-notifications-updated'))
}
