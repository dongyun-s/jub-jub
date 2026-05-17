/**
 * Layout.tsx
 * 공통 레이아웃 래퍼
 * - 모든 페이지를 감싸서 모바일 중앙 정렬·최대 너비(max-w-md) 적용
 * - 선택적 핑크 그라데이션·블러 배경 제공
 */

import type { ReactNode } from 'react'

interface LayoutProps {
  /** 레이아웃 안에 넣을 페이지 콘텐츠 */
  children: ReactNode
  /** true면 핑크 블러 원형 배경 표시, false면 배경 없음 (일부 페이지용) */
  showBackground?: boolean
}

function Layout({ children, showBackground = true }: LayoutProps) {
  return (
    /* 전체 뷰포트 높이, 회색 배경 */
    <div className="h-dvh bg-gray-100">
      {/* 모바일 중앙 컨테이너: 최대 너비 제한, 세로 flex, 그라데이션 배경 */}
      <div className="relative mx-auto flex h-full max-w-md flex-col overflow-hidden bg-gradient-to-b from-white via-pink-50 to-pink-100 shadow-xl">
        {/* 배경 장식: 클릭 불가, 블러 원형 2개 */}
        {showBackground && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-20 top-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -left-20 top-1/3 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          </div>
        )}
        {/* 실제 페이지 영역 (z-10으로 배경 위에 표시) */}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout
