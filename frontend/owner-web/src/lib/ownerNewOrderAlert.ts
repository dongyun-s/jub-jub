import type { MockOwnerOrder } from './mocks/ownerMockData'

let titleFlashInterval: ReturnType<typeof setInterval> | null = null
let savedTitle = ''

/** 다른 앱·다른 브라우저가 앞에 있거나 탭이 비활성일 때 */
export function isOwnerPageInBackground(): boolean {
  return typeof document !== 'undefined' && document.hidden
}

export function focusOwnerWindow(): void {
  try {
    window.focus()
  } catch {
    /* ignore */
  }
}

export function flashPageTitle(alertLabel: string): void {
  stopFlashPageTitle()
  savedTitle = document.title
  let on = false
  titleFlashInterval = setInterval(() => {
    document.title = on ? savedTitle : `🔔 ${alertLabel}`
    on = !on
  }, 900)
}

export function stopFlashPageTitle(): void {
  if (titleFlashInterval != null) {
    clearInterval(titleFlashInterval)
    titleFlashInterval = null
  }
  if (savedTitle) document.title = savedTitle
}

export function playNewOrderChime(): void {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.value = 0.12
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.stop(ctx.currentTime + 0.35)
    void ctx.close()
  } catch {
    /* autoplay may block until user gesture */
  }
}

export function canUseDesktopNotification(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!canUseDesktopNotification()) return 'unsupported'
  return Notification.permission
}

export async function requestDesktopNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!canUseDesktopNotification()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

/**
 * OS 알림 — 다른 앱이 앞에 있을 때 창을 앞으로 가져오는 유일한 웹 표준 수단(사용자가 알림 클릭).
 * 웹만으로는 브라우저 창을 다른 프로그램 위로 강제로 올릴 수 없음.
 */
export function showDesktopNotification(
  order: MockOwnerOrder,
  onActivate?: () => void,
): Notification | null {
  if (!canUseDesktopNotification() || Notification.permission !== 'granted') return null

  const notification = new Notification('줍줍 · 신규 주문', {
    body: `#${order.orderNo} · ${order.summary}\n알림을 누르면 주문 화면으로 이동합니다.`,
    tag: `owner-new-order-${order.orderId}`,
    requireInteraction: true,
  })

  notification.onclick = () => {
    window.focus()
    notification.close()
    onActivate?.()
  }

  return notification
}

export function alertForNewOrder(order: MockOwnerOrder, onActivate?: () => void): void {
  playNewOrderChime()

  const inBackground = isOwnerPageInBackground()
  const desktop = showDesktopNotification(order, onActivate)

  if (inBackground) {
    // 다른 브라우저·엑셀 등이 앞에 있으면 focus()는 거의 동작하지 않음 → OS 알림에 의존
    if (!desktop) flashPageTitle('신규 주문')
    return
  }

  focusOwnerWindow()
  flashPageTitle('신규 주문')
  if (!desktop) {
    /* 탭이 보일 때는 모달이 주 알림; 알림 권한 있으면 보조 */
  }
}
