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
  /** 현재 드래그 중인지 (드래그 중이면 탭 클릭 등 무시할 때 사용) */
  isDragging: boolean
  /** 스크롤 컨테이너에 spread로 넘길 마우스 이벤트 핸들러 */
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void
    onMouseMove: (e: React.MouseEvent) => void
    onMouseUp: () => void
    onMouseLeave: () => void
  }
}

export function useDragScroll(): UseDragScrollReturn {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  /** 드래그 시작 시 마우스 X (컨테이너 기준) */
  const [startX, setStartX] = useState(0)
  /** 드래그 시작 시 scrollLeft 값 */
  const [scrollLeft, setScrollLeft] = useState(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - scrollRef.current.offsetLeft)
    setScrollLeft(scrollRef.current.scrollLeft)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX) * 1.5
    scrollRef.current.scrollLeft = scrollLeft - walk
  }, [isDragging, startX, scrollLeft])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  return {
    scrollRef,
    isDragging,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
    },
  }
}

export default useDragScroll
