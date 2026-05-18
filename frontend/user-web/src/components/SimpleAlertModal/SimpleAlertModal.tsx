/**

 * 확인 한 번으로 닫는 단순 안내 모달 (로그인 실패 등)

 */



import { useId } from 'react'

import AppModal from '../AppModal/AppModal'

import styles from './SimpleAlertModal.module.css'



export type SimpleAlertVariant = 'info' | 'success' | 'error'

const ICON_BY_VARIANT: Record<SimpleAlertVariant, string> = {
  error: 'error',
  success: 'check_circle',
  info: 'info',
}

interface SimpleAlertModalProps {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  /** 기본 error — 결제 완료 등은 success */
  variant?: SimpleAlertVariant
  onClose: () => void
}



export default function SimpleAlertModal({
  open,
  title = '알림',
  message,
  confirmLabel = '확인',
  variant = 'error',
  onClose,
}: SimpleAlertModalProps) {

  const titleId = useId()

  const descId = useId()



  return (

    <AppModal

      open={open}

      onClose={onClose}

      size="sm"

      role="alertdialog"

      aria-labelledby={titleId}

      aria-describedby={descId}

    >

      <div className={styles.iconWrap} aria-hidden>

        <span
          className={`material-symbols-outlined ${styles.icon} ${
            variant === 'success' ? styles.iconSuccess : variant === 'info' ? styles.iconInfo : ''
          }`}
        >
          {ICON_BY_VARIANT[variant]}
        </span>

      </div>

      <h2 id={titleId} className={styles.title}>

        {title}

      </h2>

      <p id={descId} className={styles.message}>

        {message}

      </p>

      <button type="button" className={styles.btn} onClick={onClose}>

        {confirmLabel}

      </button>

    </AppModal>

  )

}

