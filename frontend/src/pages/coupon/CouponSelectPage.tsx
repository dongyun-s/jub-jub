/**
 * CouponSelectPage.tsx
 * 쿠폰 선택 모달/페이지 (장바구니에서 쿠폰 클릭 시)
 * - 사용가능/사용완료 탭, 쿠폰 카드 선택 시 적용 후 장바구니로 복귀
 */

import { useState } from 'react'
import Layout from '../../components/Layout'
import BottomNav from '../../components/BottomNav'
import styles from './CouponSelectPage.module.css'

interface AppliedCoupon {
  id: number
  name: string
  discount: number
}

interface CouponSelectPageProps {
  onClose: () => void
  onSelect?: (coupon: AppliedCoupon | null) => void
  onGoHome?: () => void
  onCartClick?: () => void
  onOrdersClick?: () => void
  onMapClick?: () => void
  onMypageClick?: () => void
  cartCount?: number
}

interface Coupon {
  id: number
  title: string
  expiry: string
  condition: string
  icon: 'discount' | 'percent' | 'delivery'
  discount: number
}

/** 사용가능/사용완료 쿠폰 목록 (데모) */
const coupons: Coupon[] = [
  {
    id: 1,
    title: '3,000원 할인 쿠폰',
    expiry: '2024-12-31',
    condition: '모든 품목 적용 가능',
    icon: 'discount',
    discount: 3000,
  },
  {
    id: 2,
    title: '5,000원 할인 쿠폰',
    expiry: '2024-12-25',
    condition: '20,000원 이상 주문 시',
    icon: 'percent',
    discount: 5000,
  },
  {
    id: 3,
    title: '무료 배송 쿠폰',
    expiry: '2024-12-15',
    condition: '일부 매장 제외',
    icon: 'delivery',
    discount: 3000,
  },
]

function CouponSelectPage({ onClose, onSelect, onGoHome, onCartClick, onOrdersClick, onMapClick, onMypageClick, cartCount = 0 }: CouponSelectPageProps) {
  const [activeTab, setActiveTab] = useState<'available' | 'expired'>('available')

  const handleUse = (coupon: Coupon) => {
    onSelect?.({
      id: coupon.id,
      name: coupon.title,
      discount: coupon.discount,
    })
  }

  const getIcon = (icon: Coupon['icon']) => {
    switch (icon) {
      case 'discount':
        return (
          <svg className={styles.couponIcon} viewBox="0 0 24 24" fill="none">
            <rect x="2" y="4" width="20" height="16" rx="2" stroke="white" strokeWidth="2"/>
            <path d="M2 10h20" stroke="white" strokeWidth="2"/>
            <circle cx="12" cy="14" r="2" fill="white"/>
          </svg>
        )
      case 'percent':
        return (
          <svg className={styles.couponIcon} viewBox="0 0 24 24" fill="none">
            <circle cx="7" cy="7" r="3" stroke="white" strokeWidth="2"/>
            <circle cx="17" cy="17" r="3" stroke="white" strokeWidth="2"/>
            <path d="M19 5L5 19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )
      case 'delivery':
        return (
          <svg className={styles.couponIcon} viewBox="0 0 24 24" fill="none">
            <path d="M16 16V6H2v10h14z" stroke="white" strokeWidth="2"/>
            <path d="M16 10h4l2 3v3h-6v-6z" stroke="white" strokeWidth="2"/>
            <circle cx="6" cy="18" r="2" stroke="white" strokeWidth="2"/>
            <circle cx="18" cy="18" r="2" stroke="white" strokeWidth="2"/>
          </svg>
        )
    }
  }

  return (
    <Layout showBackground={false}>
      <div className={styles.root}>
        {/* 헤더 */}
        <header className={styles.header}>
          <button onClick={onClose} className={styles.backButton}>
            <span className={`material-symbols-outlined ${styles.backIcon}`}>arrow_back</span>
          </button>
          <div className={styles.headerCenter}>
            <img src="/logo.png" alt="JUB-JUB" className={styles.logo} />
          </div>
          <div className={styles.headerSpacer} />
        </header>

        {/* 페이지 제목 */}
        <div className={styles.titleWrap}>
          <h1 className={styles.pageTitle}>쿠폰함</h1>
        </div>

        {/* 탭 */}
        <div className={styles.tabRow}>
          <button
            onClick={() => setActiveTab('available')}
            className={`${styles.tabButton} ${activeTab === 'available' ? styles.tabButtonActive : styles.tabButtonInactive}`}
          >
            사용 가능
          </button>
          <button
            onClick={() => setActiveTab('expired')}
            className={`${styles.tabButton} ${activeTab === 'expired' ? styles.tabButtonActive : styles.tabButtonInactive}`}
          >
            만료됨
          </button>
        </div>

        {/* 쿠폰 리스트 */}
        <div className={styles.listArea}>
          {activeTab === 'available' ? (
            <div className={styles.storeList}>
              {coupons.map((coupon) => (
                <div key={coupon.id} className={styles.couponCard}>
                  <div className={styles.couponIconWrap}>
                    {getIcon(coupon.icon)}
                  </div>
                  <div className={styles.couponInfo}>
                    <h3 className={styles.couponTitle}>{coupon.title}</h3>
                    <p className={styles.couponExpiry}>만료일: {coupon.expiry}</p>
                    <p className={styles.couponCondition}>
                      <span className={styles.conditionBadge}>i</span>
                      {coupon.condition}
                    </p>
                  </div>
                  <button onClick={() => handleUse(coupon)} className={styles.useButton}>
                    사용하기
                  </button>
                </div>
              ))}

              <div className={styles.promoBanner}>
                <p className={styles.promoSub}>JUB-JUB 회원 특별 혜택</p>
                <h3 className={styles.promoTitle}>매일 새로운 쿠폰이 도착해요!</h3>
                <p className={styles.promoDesc}>앱 알림을 켜고 놓치지 마세요 ✨</p>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <span className={`material-symbols-outlined ${styles.emptyIcon}`}>receipt_long</span>
              <p className={styles.emptyText}>만료된 쿠폰이 없습니다</p>
            </div>
          )}
        </div>

        {/* 하단 네비게이션 */}
        <BottomNav 
          active="cart" 
          cartCount={cartCount}
          onNavigate={(page) => {
            if (page === 'home') onGoHome?.()
            if (page === 'orders') onOrdersClick?.()
            if (page === 'cart') onCartClick?.()
            if (page === 'map') onMapClick?.()
            if (page === 'mypage') onMypageClick?.()
          }}
        />
      </div>
    </Layout>
  )
}

export default CouponSelectPage
