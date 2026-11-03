/**
 * 확인 한 번으로 닫는 단순 안내 모달 (로그인 실패 등)
 */

import { useId } from 'react'
import AppModal from '../AppModal/AppModal'
import mc from '../AppModal/modalContent.module.css'

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

  const iconClass =
    variant === 'success'
      ? `${mc.icon} ${mc.iconFill}`
      : variant === 'info'
        ? mc.icon
        : mc.icon

  return (
    <AppModal
      open={open}
      onClose={onClose}
      size="sm"
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div className={mc.iconWrap} aria-hidden>
        <span className={`material-symbols-outlined ${iconClass}`}>{ICON_BY_VARIANT[variant]}</span>
      </div>
      <h2 id={titleId} className={mc.titleCenter}>
        {title}
      </h2>
      <p id={descId} className={mc.messageCenter}>
        {message}
      </p>
      <button type="button" className={mc.btnPrimary} onClick={onClose}>
        {confirmLabel}
      </button>
    </AppModal>
  )
}
