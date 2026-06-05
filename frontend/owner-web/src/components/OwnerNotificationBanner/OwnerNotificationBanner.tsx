import { useState } from 'react'
import { Icon } from '../Icon'
import {
  canUseDesktopNotification,
  getNotificationPermission,
  requestDesktopNotificationPermission,
} from '../../lib/ownerNewOrderAlert'
import styles from './OwnerNotificationBanner.module.css'

const DISMISS_KEY = 'owner_notify_banner_dismiss'

export function OwnerNotificationBanner() {
  const [permission, setPermission] = useState(getNotificationPermission)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  if (!canUseDesktopNotification() || permission === 'granted' || permission === 'denied' || dismissed) {
    return null
  }

  const enable = async () => {
    const result = await requestDesktopNotificationPermission()
    setPermission(result === 'unsupported' ? 'denied' : result)
  }

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  return (
    <div className={styles.banner} role="status">
      <Icon name="info" className={styles.icon} />
      <p className={styles.text}>
        <strong>엑셀·다른 브라우저</strong>를 쓰는 동안에도 주문을 받으려면{' '}
        <strong>브라우저 알림</strong>을 켜 주세요. 웹만으로는 창을 강제로 맨 앞에 둘 수 없고,{' '}
        <strong>알림을 클릭</strong>하면 이 브라우저가 앞으로 옵니다.
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.enableBtn} onClick={() => void enable()}>
          알림 허용
        </button>
        <button type="button" className={styles.dismissBtn} onClick={dismiss}>
          닫기
        </button>
      </div>
    </div>
  )
}
