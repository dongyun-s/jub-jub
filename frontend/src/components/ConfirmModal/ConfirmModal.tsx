import { useId } from 'react'
import AppModal from '../AppModal/AppModal'
import styles from './ConfirmModal.module.css'

interface ConfirmModalProps {
  open: boolean
  title?: string
  message: string
  cancelLabel?: string
  confirmLabel?: string
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmModal({
  open,
  title = '확인',
  message,
  cancelLabel = '취소',
  confirmLabel = '확인',
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const titleId = useId()
  const descId = useId()

  return (
    <AppModal
      open={open}
      onClose={onCancel}
      size="sm"
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div className={styles.iconWrap} aria-hidden>
        <span className={`material-symbols-outlined ${styles.icon}`}>help</span>
      </div>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      <p id={descId} className={styles.message}>
        {message}
      </p>
      <div className={styles.btnRow}>
        <button type="button" className={styles.btnCancel} onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className={styles.btnConfirm} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </AppModal>
  )
}

