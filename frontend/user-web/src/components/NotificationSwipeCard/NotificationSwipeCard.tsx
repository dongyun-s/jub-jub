/**
 * 알림 카드 — 오른쪽으로 잡아 밀어 읽음 처리 (세로 드래그는 목록 스크롤에 양보)
 */
import { useRef, useState, type ReactNode } from 'react'
import styles from './NotificationSwipeCard.module.css'

const SWIPE_THRESHOLD_PX = 72
const MAX_OFFSET_PX = 120
const AXIS_LOCK_PX = 10

type NotificationSwipeCardProps = {
  enabled: boolean
  read: boolean
  onSwipeRead: () => void
  children: ReactNode
}

export default function NotificationSwipeCard({
  enabled,
  read,
  onSwipeRead,
  children,
}: NotificationSwipeCardProps) {
  const [offsetX, setOffsetX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const pointerDownRef = useRef(false)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const startOffsetRef = useRef(0)
  const axisRef = useRef<'none' | 'x' | 'y'>('none')
  const didSwipeRef = useRef(false)
  const captureTargetRef = useRef<HTMLElement | null>(null)
  const captureIdRef = useRef<number | null>(null)

  const releaseCapture = () => {
    if (captureTargetRef.current != null && captureIdRef.current != null) {
      try {
        captureTargetRef.current.releasePointerCapture(captureIdRef.current)
      } catch {
        /* noop */
      }
    }
    captureTargetRef.current = null
    captureIdRef.current = null
  }

  if (!enabled || read) {
    return <div className={styles.wrap}>{children}</div>
  }

  const resetGesture = () => {
    pointerDownRef.current = false
    setDragging(false)
    axisRef.current = 'none'
    releaseCapture()
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    pointerDownRef.current = true
    startXRef.current = e.clientX
    startYRef.current = e.clientY
    startOffsetRef.current = offsetX
    axisRef.current = 'none'
    didSwipeRef.current = false
    setDragging(false)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointerDownRef.current || (e.buttons & 1) === 0) return

    const dx = e.clientX - startXRef.current
    const dy = e.clientY - startYRef.current

    if (axisRef.current === 'none') {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return
      axisRef.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (axisRef.current === 'y') return
      setDragging(true)
      captureTargetRef.current = e.currentTarget as HTMLElement
      captureIdRef.current = e.pointerId
      try {
        captureTargetRef.current.setPointerCapture(e.pointerId)
      } catch {
        /* noop */
      }
    }

    if (axisRef.current !== 'x') return

    e.stopPropagation()
    e.preventDefault()

    const next = Math.max(0, Math.min(MAX_OFFSET_PX, startOffsetRef.current + dx))
    setOffsetX(next)
    if (next >= SWIPE_THRESHOLD_PX) didSwipeRef.current = true
  }

  const finishDrag = () => {
    if (axisRef.current === 'x') {
      setOffsetX((current) => {
        if (current >= SWIPE_THRESHOLD_PX) onSwipeRead()
        return 0
      })
    } else if (pointerDownRef.current) {
      setOffsetX(0)
    }
    resetGesture()
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.actionBg} aria-hidden>
        <span className="material-symbols-outlined text-base" style={{ marginRight: 4 }}>
          done
        </span>
        읽음
      </div>
      <div
        className={`${styles.panel} ${dragging ? styles.panelDragging : styles.panelGrab}`}
        style={{ transform: `translateX(${offsetX}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onClickCapture={(e) => {
          if (didSwipeRef.current) {
            e.preventDefault()
            e.stopPropagation()
            didSwipeRef.current = false
          }
        }}
      >
        {children}
      </div>
    </div>
  )
}
