const KEY = 'jubjub_notification_swipe_read'

/** 알림 카드 밀어서 읽음 처리 on/off (기본 켜짐) */
export function isNotificationSwipeReadEnabled(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const v = window.localStorage.getItem(KEY)
    if (v === '0' || v === 'false') return false
    return true
  } catch {
    return true
  }
}

export function setNotificationSwipeReadEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, enabled ? '1' : '0')
  } catch {
    /* ignore */
  }
}
