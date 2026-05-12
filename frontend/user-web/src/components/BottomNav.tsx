/**
 * BottomNav.tsx
 * 하단 고정 탭 네비게이션 (푸터)
 * - 홈 / 장바구니 / 주문내역 / 지도 / 내정보 5개 탭
 * - 장바구니 탭에 수량 뱃지 표시
 */

import styles from './BottomNav.module.css'

interface BottomNavProps {
  /** 현재 활성 탭 (강조 표시) */
  active: 'home' | 'map' | 'orders' | 'cart' | 'mypage'
  /** 탭 클릭 시 호출 (page id 전달) */
  onNavigate?: (page: string) => void
  /** 장바구니 아이콘 위에 표시할 수량 뱃지 (0이면 미표시) */
  cartCount?: number
}

/** 탭 목록: id, Material 아이콘명, 라벨 */
const navItems = [
  { id: 'home', icon: 'home', label: '홈' },
  { id: 'cart', icon: 'shopping_cart', label: '장바구니' },
  { id: 'orders', icon: 'receipt_long', label: '주문내역' },
  { id: 'map', icon: 'map', label: '지도' },
  { id: 'mypage', icon: 'person', label: '내정보' },
]

function BottomNav({ active, onNavigate, cartCount = 0 }: BottomNavProps) {
  return (
    <nav className={styles.nav}>
      {navItems.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onNavigate?.(item.id)}
          className={styles.item}
        >
          <span
            className={`material-symbols-outlined ${styles.icon} ${
              active === item.id ? styles.iconActive : styles.iconInactive
            }`}
          >
            {item.icon}
          </span>
          {/* 장바구니만 수량 뱃지 표시 */}
          {item.id === 'cart' && cartCount > 0 && (
            <span className={styles.badge}>{cartCount}</span>
          )}
          <span
            className={`${styles.label} ${
              active === item.id ? styles.labelActive : styles.labelInactive
            }`}
          >
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  )
}

export default BottomNav
