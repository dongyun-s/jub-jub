/**

 * 확인 한 번으로 닫는 단순 안내 모달 (로그인 실패 등)

 */



import { useId } from 'react'

import AppModal from '../AppModal/AppModal'

import styles from './SimpleAlertModal.module.css'



interface SimpleAlertModalProps {

  open: boolean

  title?: string

  message: string

  confirmLabel?: string

  onClose: () => void

}



export default function SimpleAlertModal({

  open,

  title = '알림',

  message,

  confirmLabel = '확인',

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

        <span className={`material-symbols-outlined ${styles.icon}`}>error</span>

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

