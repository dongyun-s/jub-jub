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
import {
  computeCouponExpiryProgress,
  type CouponExpiryProgress,
  type CouponExpiryUrgency,
} from '../../lib/couponExpiry'
import styles from './CouponSelectPage.module.css'

interface AppliedCoupon {
  id: number
  name: string
  discount: number
}

interface CouponSelectPageProps {
  onClose: () => void
  onSelect?: (coupon: AppliedCoupon | null) => void
  /** 만료 임박 알림 등에서 진입 시 곧 만료 쿠폰 강조 */
  highlightExpiringSoon?: boolean
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
  expiryProgress: CouponExpiryProgress
  isUsed: boolean
  isExpired: boolean
  usedAt: string | null
}

function isCouponAvailable(d: MemberCouponDto, todayStr: string): boolean {
  if (d.isUsed) return false
  if (d.isExpired) return false
  return d.expiredAt >= todayStr
}

function inactiveStatusLabel(coupon: CouponUi): string {
  return coupon.isUsed ? '사용됨' : '만료됨'
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
    expiryProgress: computeCouponExpiryProgress(d.expiredAt),
    isUsed: d.isUsed,
    isExpired: d.isExpired,
    usedAt: d.usedAt,
  }
}

function expiryBarClass(urgency: CouponExpiryUrgency): string {
  switch (urgency) {
    case 'critical':
      return styles.expiryBarCritical
    case 'soon':
      return styles.expiryBarSoon
    case 'expired':
      return styles.expiryBarExpired
    default:
      return styles.expiryBarNormal
  }
}

function CouponSelectPage({
  onClose,
  onSelect,
  highlightExpiringSoon = false,
  onGoHome,
  onCartClick,
  onOrdersClick,
  onMapClick,
  onMypageClick,
  cartCount = 0,
}: CouponSelectPageProps) {
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
    const list = rows.filter((r) => isCouponAvailable(r, todayStr)).map(mapDtoToUi)
    return [...list].sort((a, b) => a.expiryProgress.daysLeft - b.expiryProgress.daysLeft)
  }, [rows, todayStr])

  const inactiveCoupons = useMemo(() => {
    return rows
      .filter((r) => !isCouponAvailable(r, todayStr))
      .map(mapDtoToUi)
      .sort((a, b) => {
        if (a.isUsed !== b.isUsed) return a.isUsed ? -1 : 1
        return b.expiry.localeCompare(a.expiry)
      })
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
          {highlightExpiringSoon && availableCoupons.some((c) => c.expiryProgress.urgency === 'soon' || c.expiryProgress.urgency === 'critical') && (
            <p className={styles.expiringBanner}>만료가 임박한 쿠폰이 있어요. 아래에서 확인해 주세요.</p>
          )}
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
            만료·사용됨
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
              {availableCoupons.map((coupon) => {
                const soon =
                  highlightExpiringSoon &&
                  (coupon.expiryProgress.urgency === 'soon' || coupon.expiryProgress.urgency === 'critical')
                return (
                <div
                  key={coupon.memberCouponId}
                  className={`${styles.couponCard} ${soon ? styles.couponCardSoon : ''}`}
                >
                  <div className={styles.couponIconWrap}>
                    {getIcon(coupon.icon)}
                  </div>
                  <div className={styles.couponInfo}>
                    <h3 className={styles.couponTitle}>{coupon.title}</h3>
                    <div className={styles.expiryRow}>
                      <span
                        className={`${styles.expiryBadge} ${
                          coupon.expiryProgress.urgency === 'critical'
                            ? styles.expiryBadgeCritical
                            : coupon.expiryProgress.urgency === 'soon'
                              ? styles.expiryBadgeSoon
                              : ''
                        }`}
                      >
                        {coupon.expiryProgress.label}
                      </span>
                      <span className={styles.couponExpiry}>~ {coupon.expiry}</span>
                    </div>
                    <div className={styles.expiryTrack} aria-hidden>
                      <div
                        className={`${styles.expiryBar} ${expiryBarClass(coupon.expiryProgress.urgency)}`}
                        style={{ width: `${coupon.expiryProgress.percentRemaining}%` }}
                      />
                    </div>
                    <p className={styles.couponCondition}>
                      <span className={styles.conditionBadge}>i</span>
                      {coupon.condition}
                    </p>
                  </div>
                  <button onClick={() => handleUse(coupon)} className={styles.useButton}>
                    사용하기
                  </button>
                </div>
              )})}

              {availableCoupons.length === 0 && (
                <div className={styles.emptyState}>
                  <span className={`material-symbols-outlined ${styles.emptyIcon}`}>confirmation_number</span>
                  <p className={styles.emptyText}>사용 가능한 쿠폰이 없습니다</p>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.storeList}>
              {inactiveCoupons.map((coupon) => (
                <div key={coupon.memberCouponId} className={`${styles.couponCard} ${styles.couponCardInactive}`}>
                  <div className={styles.couponIconWrap}>
                    {getIcon(coupon.icon)}
                  </div>
                  <div className={styles.couponInfo}>
                    <h3 className={styles.couponTitle}>{coupon.title}</h3>
                    {coupon.isUsed && coupon.usedAt ? (
                      <p className={styles.couponExpiry}>사용일: {coupon.usedAt}</p>
                    ) : (
                      <p className={styles.couponExpiry}>만료일: {coupon.expiry}</p>
                    )}
                    {!coupon.isUsed && coupon.expiry && (
                      <p className={styles.couponExpirySub}>만료일: {coupon.expiry}</p>
                    )}
                    <p className={styles.couponCondition}>
                      <span className={styles.conditionBadge}>i</span>
                      {coupon.condition}
                    </p>
                  </div>
                  <span
                    className={`${styles.useButton} ${coupon.isUsed ? styles.statusUsed : styles.statusExpired}`}
                    style={{ cursor: 'default' }}
                  >
                    {inactiveStatusLabel(coupon)}
                  </span>
                </div>
              ))}
              {inactiveCoupons.length === 0 && (
                <div className={styles.emptyState}>
                  <span className={`material-symbols-outlined ${styles.emptyIcon}`}>receipt_long</span>
                  <p className={styles.emptyText}>만료·사용된 쿠폰이 없습니다</p>
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
