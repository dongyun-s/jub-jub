/**
 * 공통 모달 셸 — 오버레이·포커스 잠금·ESC·배경 클릭
 */

import { useEffect, type ReactNode } from 'react'
import styles from './AppModal.module.css'

export type AppModalSize = 'sm' | 'md' | 'lg'

export interface AppModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  role?: 'dialog' | 'alertdialog'
  'aria-labelledby'?: string
  'aria-describedby'?: string
  size?: AppModalSize
  /** true면 패널 패ding 없음 (내부에서 나눔) */
  flush?: boolean
  panelClassName?: string
  closeOnBackdrop?: boolean
}

const sizeClassMap = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
} as const

export default function AppModal({
  open,
  onClose,
  children,
  role = 'dialog',
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  size = 'sm',
  flush = false,
  panelClassName = '',
  closeOnBackdrop = true,
}: AppModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  const panelClass = [
    styles.panel,
    sizeClassMap[size],
    flush ? null : `${styles.panelCard} ${styles.panelPadded}`,
    panelClassName,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={panelClass}
        role={role}
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
