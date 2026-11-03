/**
 * Header.tsx
 * 공통 상단 헤더
 * - 홈/장바구니/주문내역/지도/내정보 등 탭 페이지에서 동일한 헤더 사용
 * - 왼쪽: 로고 또는 뒤로가기, 중앙: 제목 또는 로고, 오른쪽: 찜·알림 또는 커스텀
 */

import type { ReactNode } from 'react'
import NotificationIconButton from './NotificationIconButton/NotificationIconButton'
import { useUnreadNotificationCount } from '../hooks/useUnreadNotificationCount'
import styles from './Header.module.css'

interface HeaderProps {
  /** true면 왼쪽에 뒤로가기 버튼 표시 (onBack 필요) */
  showBack?: boolean
  /** 뒤로가기 클릭 시 호출 */
  onBack?: () => void
  /** 중앙에 표시할 제목. 없으면 showBack일 때만 로고, 아니면 빈 칸 */
  title?: string
  /** 오른쪽 영역: undefined=찜·알림 기본, null=비움, 노드=커스텀 */
  rightContent?: ReactNode | null
  /** 기본 오른쪽 찜 버튼 클릭 시 (rightContent 미사용 시) */
  onFavoriteClick?: () => void
  /** 기본 오른쪽 알림 버튼 클릭 시 (rightContent 미사용 시) */
  onNotificationsClick?: () => void
}

function Header({
  showBack = false,
  onBack,
  title,
  rightContent,
  onFavoriteClick,
  onNotificationsClick,
}: HeaderProps) {
  const unreadNotificationCount = useUnreadNotificationCount()

  return (
    <header className={styles.header}>
      {/* 왼쪽: 뒤로가기 또는 로고 */}
      <div className={styles.side}>
        {showBack ? (
          <button
            type="button"
            onClick={() => onBack?.()}
            className={styles.backButton}
            aria-label="뒤로 가기"
          >
            <span className={`material-symbols-outlined ${styles.backIcon}`}>arrow_back</span>
          </button>
        ) : (
          <img src="/logo.png" alt="JUB-JUB" className={styles.logo} />
        )}
      </div>

      {/* 중앙: title 있으면 제목, showBack만 있으면 로고, 둘 다 없으면 빈 칸 */}
      {title != null ? (
        <div className={styles.center}>
          <h1 className={styles.title}>{title}</h1>
        </div>
      ) : showBack ? (
        <div className={styles.center}>
          <img src="/logo.png" alt="JUB-JUB" className={styles.logoCenter} />
        </div>
      ) : (
        <div className={styles.center} />
      )}

      {/* 오른쪽: 기본 찜·알림 또는 rightContent */}
      <div className={`${styles.side} ${styles.sideRight}`}>
        {rightContent === undefined ? (
          <>
            <button type="button" onClick={onFavoriteClick} className={styles.iconButton}>
              <span className="material-symbols-outlined">favorite</span>
            </button>
            <NotificationIconButton
              unreadCount={unreadNotificationCount}
              onClick={onNotificationsClick}
            />
          </>
        ) : rightContent !== null ? (
          rightContent
        ) : null}
      </div>
    </header>
  )
}

export default Header
