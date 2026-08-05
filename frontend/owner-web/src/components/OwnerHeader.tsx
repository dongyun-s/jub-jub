import { useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import { OwnerSettingsModal } from './OwnerSettingsModal/OwnerSettingsModal'
import SimpleAlertModal from './SimpleAlertModal/SimpleAlertModal'
import styles from './OwnerHeader.module.css'

type OwnerHeaderProps = {
  title: string
  subtitle?: string
  right?: ReactNode
}

export function OwnerHeader({ title, subtitle, right }: OwnerHeaderProps) {
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const showSoon = (feature: string) => {
    setAlertMessage(`${feature} 기능은 준비 중입니다.`)
    setAlertOpen(true)
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.left}>
          <h1 className={styles.brand}>
            <img src="/logo.png" alt="" className={styles.brandLogo} width={28} height={28} />
            JubJub
            <span className={styles.brandSub}>사장님</span>
          </h1>
          <span className={styles.sep}>|</span>
          <span className={styles.title}>{title}</span>
          {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
        </div>
        <div className={styles.right}>
          <div className={styles.iconRow}>
            <button type="button" className={styles.iconBtn} aria-label="알림" onClick={() => showSoon('알림')}>
              <Icon name="notifications" />
            </button>
            <button type="button" className={styles.iconBtn} aria-label="설정" onClick={() => setSettingsOpen(true)}>
              <Icon name="settings" />
            </button>
          </div>
          {right}
        </div>
      </header>
      <OwnerSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <SimpleAlertModal open={alertOpen} title="안내" message={alertMessage} variant="info" onClose={() => setAlertOpen(false)} />
    </>
  )
}
