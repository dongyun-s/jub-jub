/**
 * useDragScroll.ts
 * 마우스 드래그로 가로 스크롤을 할 수 있게 해주는 커스텀 훅
 * - 카테고리 탭·필터 등 가로 스크롤 영역에 사용
 * - 드래그 중 클릭과 구분하기 위해 isDragging 반환 (탭 클릭 무시용)
 */

import { useRef, useState, useCallback } from 'react'

interface UseDragScrollReturn {
  /** 스크롤할 DOM에 ref로 연결 */
  scrollRef: React.RefObject<HTMLDivElement | null>
  /** 현재 드래그 중인지 (스크롤바·커서 스타일용) */
  isDragging: boolean
  /** 직전에 드래그 스크롤이었으면 true — 탭 클릭 무시용 */
  shouldIgnoreClick: () => boolean
  /** 스크롤 컨테이너에 spread로 넘길 마우스 이벤트 핸들러 */
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void
    onMouseMove: (e: React.MouseEvent) => void
    onMouseUp: () => void
    onMouseLeave: () => void
  }
}

const DRAG_THRESHOLD_PX = 6

export function useDragScroll(): UseDragScrollReturn {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const pointerActiveRef = useRef(false)
  const didDragRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return
    pointerActiveRef.current = true
    didDragRef.current = false
    setIsDragging(false)
    startXRef.current = e.pageX - scrollRef.current.offsetLeft
    scrollLeftRef.current = scrollRef.current.scrollLeft
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!pointerActiveRef.current || !scrollRef.current) return
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = x - startXRef.current
    if (!didDragRef.current && Math.abs(walk) < DRAG_THRESHOLD_PX) return
    didDragRef.current = true
    setIsDragging(true)
    e.preventDefault()
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk * 1.5
  }, [])

  const handleMouseUp = useCallback(() => {
    pointerActiveRef.current = false
    setIsDragging(false)
  }, [])

  const shouldIgnoreClick = useCallback(() => {
    if (!didDragRef.current) return false
    didDragRef.current = false
    return true
  }, [])

  const handleMouseLeave = useCallback(() => {
    pointerActiveRef.current = false
    setIsDragging(false)
    didDragRef.current = false
  }, [])

  return {
    scrollRef,
    isDragging,
    shouldIgnoreClick,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
    },
  }
}

export default useDragScroll
