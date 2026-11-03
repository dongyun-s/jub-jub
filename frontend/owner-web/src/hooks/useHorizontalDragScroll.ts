/**
 * 마우스·터치 드래그로 가로 스크롤 (신규 주문 카드 목록 등)
 */
import { useCallback, useRef, useState } from 'react'

const DRAG_THRESHOLD_PX = 6

export function useHorizontalDragScroll() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const pointerActiveRef = useRef(false)
  const didDragRef = useRef(false)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const scrollLeftRef = useRef(0)

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
    scrollLeftRef.current = scrollRef.current.scrollLeft
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointerActiveRef.current || !scrollRef.current || (e.buttons & 1) === 0) return
    const walkX = e.clientX - startXRef.current
    const walkY = e.clientY - startYRef.current
    if (!didDragRef.current) {
      if (Math.abs(walkX) < DRAG_THRESHOLD_PX && Math.abs(walkY) < DRAG_THRESHOLD_PX) return
      if (Math.abs(walkY) > Math.abs(walkX)) {
        pointerActiveRef.current = false
        return
      }
    }
    didDragRef.current = true
    setIsDragging(true)
    e.preventDefault()
    scrollRef.current.scrollLeft = scrollLeftRef.current - walkX
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
    captureHandlers: {
      onPointerDownCapture: onPointerDown,
      onPointerMoveCapture: onPointerMove,
      onPointerUpCapture: endDrag,
      onPointerCancelCapture: endDrag,
    },
  }
}
