/**
 * CouponSelectPage.tsx
 * 쿠폰 선택 모달/페이지 (장바구니에서 쿠폰 클릭 시)
 * - 사용가능/사용완료 탭, 쿠폰 카드 선택 시 적용 후 장바구니로 복귀
 */

import { useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout'
import BottomNav from '../../components/BottomNav'
import { ApiError } from '../../api/authClient'
import { fetchMyCoupons, type MemberCouponDto } from '../../api/rewards'
import { getAccessToken } from '../../lib/authStorage'
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

interface CouponUi {
  memberCouponId: number
  title: string
  expiry: string
  condition: string
  icon: 'discount' | 'percent' | 'delivery'
  discount: number
}

function mapDtoToUi(d: MemberCouponDto): CouponUi {
  return {
    memberCouponId: d.memberCouponId,
    title: d.name,
    expiry: d.expiredAt,
    condition:
      d.minOrderAmount > 0
        ? `${d.minOrderAmount.toLocaleString('ko-KR')}원 이상 주문 시`
        : '최소 주문 금액 조건 없음',
    icon: 'discount',
    discount: d.discountAmount,
  }
}

function CouponSelectPage({ onClose, onSelect, onGoHome, onCartClick, onOrdersClick, onMapClick, onMypageClick, cartCount = 0 }: CouponSelectPageProps) {
  const [activeTab, setActiveTab] = useState<'available' | 'expired'>('available')
  const [rows, setRows] = useState<MemberCouponDto[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  useEffect(() => {
    if (!getAccessToken()) {
      setRows([])
      setListLoading(false)
      setListError('로그인 후 쿠폰함을 이용할 수 있습니다.')
      return
    }
    setListLoading(true)
    setListError(null)
    void fetchMyCoupons()
      .then(setRows)
      .catch((e) => {
        setRows([])
        setListError(e instanceof ApiError ? e.message : '쿠폰 목록을 불러오지 못했습니다.')
      })
      .finally(() => setListLoading(false))
  }, [])

  const todayStr = useMemo(() => {
    const n = new Date()
    const y = n.getFullYear()
    const m = String(n.getMonth() + 1).padStart(2, '0')
    const d = String(n.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [])

  const availableCoupons = useMemo(() => {
    return rows.filter((r) => r.expiredAt >= todayStr).map(mapDtoToUi)
  }, [rows, todayStr])

  const expiredCoupons = useMemo(() => {
    return rows.filter((r) => r.expiredAt < todayStr).map(mapDtoToUi)
  }, [rows, todayStr])

  const handleUse = (coupon: CouponUi) => {
    onSelect?.({
      id: coupon.memberCouponId,
      name: coupon.title,
      discount: coupon.discount,
    })
  }

  const getIcon = (icon: CouponUi['icon']) => {
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
          {listLoading ? (
            <div className={styles.emptyState}>
              <span className={`material-symbols-outlined ${styles.emptyIcon}`}>hourglass_empty</span>
              <p className={styles.emptyText}>쿠폰을 불러오는 중…</p>
            </div>
          ) : listError ? (
            <div className={styles.emptyState}>
              <span className={`material-symbols-outlined ${styles.emptyIcon}`}>error</span>
              <p className={styles.emptyText}>{listError}</p>
            </div>
          ) : activeTab === 'available' ? (
            <div className={styles.storeList}>
              {availableCoupons.map((coupon) => (
                <div key={coupon.memberCouponId} className={styles.couponCard}>
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

              {availableCoupons.length === 0 && (
                <div className={styles.emptyState}>
                  <span className={`material-symbols-outlined ${styles.emptyIcon}`}>confirmation_number</span>
                  <p className={styles.emptyText}>사용 가능한 쿠폰이 없습니다</p>
                </div>
              )}

              <div className={styles.promoBanner}>
                <p className={styles.promoSub}>JUB-JUB 회원 특별 혜택</p>
                <h3 className={styles.promoTitle}>매일 새로운 쿠폰이 도착해요!</h3>
                <p className={styles.promoDesc}>앱 알림을 켜고 놓치지 마세요 ✨</p>
              </div>
            </div>
          ) : (
            <div className={styles.storeList}>
              {expiredCoupons.map((coupon) => (
                <div key={coupon.memberCouponId} className={styles.couponCard}>
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
                  <span className={styles.useButton} style={{ opacity: 0.5, cursor: 'default' }}>
                    만료됨
                  </span>
                </div>
              ))}
              {expiredCoupons.length === 0 && (
                <div className={styles.emptyState}>
                  <span className={`material-symbols-outlined ${styles.emptyIcon}`}>receipt_long</span>
                  <p className={styles.emptyText}>만료된 쿠폰이 없습니다</p>
                </div>
              )}
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
