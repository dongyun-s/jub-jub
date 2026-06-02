/**
 * 마우스·터치 드래그로 세로 스크롤 (알림 목록 등)
 */
import { useCallback, useRef, useState } from 'react'

const DRAG_THRESHOLD_PX = 6

export function useVerticalDragScroll() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const pointerActiveRef = useRef(false)
  const didDragRef = useRef(false)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const scrollTopRef = useRef(0)

  const endDrag = useCallback(() => {
    pointerActiveRef.current = false
    setIsDragging(false)
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 || !scrollRef.current) return
    pointerActiveRef.current = true
    didDragRef.current = false
    setIsDragging(false)
    startXRef.current = e.clientX
    startYRef.current = e.clientY
    scrollTopRef.current = scrollRef.current.scrollTop
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointerActiveRef.current || !scrollRef.current || (e.buttons & 1) === 0) return
    const walkY = e.clientY - startYRef.current
    const walkX = e.clientX - startXRef.current
    if (!didDragRef.current) {
      if (Math.abs(walkY) < DRAG_THRESHOLD_PX && Math.abs(walkX) < DRAG_THRESHOLD_PX) return
      if (Math.abs(walkX) > Math.abs(walkY)) {
        pointerActiveRef.current = false
        return
      }
    }
    didDragRef.current = true
    setIsDragging(true)
    e.preventDefault()
    scrollRef.current.scrollTop = scrollTopRef.current - walkY
  }, [])

  const shouldIgnoreClick = useCallback(() => {
    if (!didDragRef.current) return false
    didDragRef.current = false
    return true
  }, [])

  return {
    scrollRef,
    isDragging,
    shouldIgnoreClick,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onPointerLeave: endDrag,
    },
    /** 자식(알림 카드) 위에서 시작해도 세로 드래그 스크롤 */
    captureHandlers: {
      onPointerDownCapture: onPointerDown,
      onPointerMoveCapture: onPointerMove,
      onPointerUpCapture: endDrag,
      onPointerCancelCapture: endDrag,
    },
  }
}
