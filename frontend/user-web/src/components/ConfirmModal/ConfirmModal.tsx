import { useId } from 'react'
import AppModal from '../AppModal/AppModal'
import mc from '../AppModal/modalContent.module.css'

interface ConfirmModalProps {
  open: boolean
  title?: string
  message: string
  cancelLabel?: string
  confirmLabel?: string
  /** 확인 버튼 스타일 */
  confirmTone?: 'primary' | 'danger'
  confirmDisabled?: boolean
  cancelDisabled?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmModal({
  open,
  title = '확인',
  message,
  cancelLabel = '취소',
  confirmLabel = '확인',
  confirmTone = 'primary',
  confirmDisabled = false,
  cancelDisabled = false,
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
      <div className={mc.iconWrap} aria-hidden>
        <span className={`material-symbols-outlined ${mc.icon}`}>help</span>
      </div>
      <h2 id={titleId} className={mc.titleCenter}>
        {title}
      </h2>
      <p id={descId} className={mc.messageCenter}>
        {message}
      </p>
      <div className={mc.btnRow}>
        <button type="button" className={mc.btnCancel} onClick={onCancel} disabled={cancelDisabled}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={confirmTone === 'danger' ? mc.btnDanger : mc.btnPrimary}
          onClick={onConfirm}
          disabled={confirmDisabled}
        >
          {confirmLabel}
        </button>
      </div>
    </AppModal>
  )
}
