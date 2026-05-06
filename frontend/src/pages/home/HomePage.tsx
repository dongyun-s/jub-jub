/**
 * HomePage.tsx
 * 메인 홈 페이지 (탭: 홈)
 * - 검색바, 진행 중 주문 배너, 리워드/등급 카드, 던전 카테고리, 프로모션, 맛집 리스트
 * - 하단 네비로 장바구니/주문내역/지도/내정보 이동
 */

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import FeaturedRestaurantList from '../../components/FeaturedRestaurantList'
import SearchBar from '../../components/SearchBar'
import { fetchStores } from '../../api/store'
import type { FeaturedRestaurant } from '../../constants'
import { FEATURED_RESTAURANTS, HOME_CATEGORIES } from '../../constants'
import { mapStoreListItemToFeatured } from '../../lib/storeUi'
import { getAttendanceStreak, isAttendanceMarkedDone } from '../../lib/rewardAttendance'
import { useProfile } from '../../hooks/useProfile'
import { fetchRewardMe, type RewardMeResponse } from '../../api/rewards'
import { getAccessToken } from '../../lib/authStorage'
import { getTierLabelEn, getTierTheme } from '../../lib/rewardTierTheme'
import styles from './HomePage.module.css'

interface HomePageProps {
  onCategoryClick?: () => void
  onCartClick?: () => void
  onOrdersClick?: () => void
  onOrderStatusClick?: () => void
  onMapClick?: () => void
  onMypageClick?: () => void
  onFavoritesClick?: () => void
  onNotificationsClick?: () => void
  onStoreSelect?: (storeId: number) => void
  /** 진행 중 주문이 있으면 상단 배너 표시 */
  hasActiveOrder?: boolean
  cartCount?: number
}

function HomePage({
  onCategoryClick,
  onCartClick,
  onOrdersClick,
  onOrderStatusClick,
  onMapClick,
  onMypageClick,
  onFavoritesClick,
  onNotificationsClick,
  onStoreSelect,
  hasActiveOrder,
  cartCount = 0,
}: HomePageProps) {
  const { profile } = useProfile()
  const [searchQuery, setSearchQuery] = useState('')
  const [restaurants, setRestaurants] = useState<FeaturedRestaurant[]>(FEATURED_RESTAURANTS)
  const [rewardMe, setRewardMe] = useState<RewardMeResponse | null>(null)
  const [rewardLoading, setRewardLoading] = useState(false)
  const [rewardFetchFailed, setRewardFetchFailed] = useState(false)
  const [attendanceDoneToday, setAttendanceDoneToday] = useState(false)
  const [attendanceStreak, setAttendanceStreak] = useState(0)

  const greetingName =
    rewardMe?.nickname?.trim() ||
    profile?.nickname?.trim() ||
    profile?.name?.trim() ||
    '회원'

  useEffect(() => {
    if (!getAccessToken()) {
      setRewardMe(null)
      setRewardFetchFailed(false)
      return
    }
    setRewardLoading(true)
    void fetchRewardMe()
      .then((data) => {
        setRewardMe(data)
        setRewardFetchFailed(false)
      })
      .catch(() => {
        setRewardMe(null)
        setRewardFetchFailed(true)
      })
      .finally(() => setRewardLoading(false))
  }, [profile?.email])

  useEffect(() => {
    const readAttendance = () => {
      if (typeof window === 'undefined') return
      setAttendanceDoneToday(isAttendanceMarkedDone(profile?.email))
      setAttendanceStreak(getAttendanceStreak(profile?.email))
    }
    readAttendance()
    window.addEventListener('focus', readAttendance)
    window.addEventListener('jubjub-attendance-local', readAttendance)
    document.addEventListener('visibilitychange', readAttendance)
    return () => {
      window.removeEventListener('focus', readAttendance)
      window.removeEventListener('jubjub-attendance-local', readAttendance)
      document.removeEventListener('visibilitychange', readAttendance)
    }
  }, [profile?.email])

  useEffect(() => {
    let cancelled = false
    fetchStores()
      .then((list) => {
        if (!cancelled && list.length > 0) {
          setRestaurants(list.map(mapStoreListItemToFeatured))
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const ordersForNext =
    rewardMe != null && rewardMe.nextTierRequiredCount > 0
      ? rewardMe.orderCount + rewardMe.nextTierRequiredCount
      : rewardMe?.orderCount ?? 0

  const gradeProgressPercent =
    rewardMe != null && ordersForNext > 0
      ? Math.min(100, (rewardMe.orderCount / ordersForNext) * 100)
      : rewardMe != null && rewardMe.nextTierRequiredCount === 0
        ? 100
        : 0

  const distanceKm =
    rewardMe != null ? Math.round((rewardMe.totalWalkingDistance / 1000) * 10) / 10 : null

  /** 고정 목표 없을 때 바 길이만 완만하게 (완전 플랫 방지) */
  const distanceBarPercent =
    distanceKm != null ? Math.min(100, Math.max(8, (distanceKm / 10) * 100)) : 0

  const tierTheme = getTierTheme(rewardMe?.tier, rewardMe?.tierName)
  const tierLabelEn = getTierLabelEn(rewardMe?.tier, rewardMe?.tierName)

  const handleGoMypage = () => {
    onMypageClick?.()
  }

  const handleAttendanceClick = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('fromHomeAttendance', '1')
    }
    onMypageClick?.()
  }
  const handleSearchSubmit = () => {
    const q = searchQuery.trim()
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('categorySearchQuery', q)
    }
    onCategoryClick?.()
  }

  return (
    <Layout showBackground={false}>
      {/* 홈은 제목 없이 로고만 표시 */}
      <Header onFavoriteClick={onFavoritesClick} onNotificationsClick={onNotificationsClick} />

      <div className={styles.hero}>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleSearchSubmit}
        />

        {/* 진행 중인 주문 배너 */}
        {hasActiveOrder && (
          <div className={styles.activeOrderWrapper}>
            <button onClick={onOrderStatusClick} className={styles.activeOrderBanner}>
              <div className={styles.activeOrderIcon}>
                <span className="material-symbols-outlined text-white text-2xl">skillet</span>
              </div>
              <div className={styles.activeOrderText}>
                <p className={styles.activeOrderLabel}>조리중</p>
                <p className={styles.activeOrderTitle}>스페셜 치킨 샐러드 외 1건</p>
                <p className={styles.activeOrderTime}>픽업 예정 15:15</p>
              </div>
              <div className={styles.activeOrderLink}>
                <span className="text-sm font-bold">주문 현황</span>
                <span className="material-symbols-outlined">chevron_right</span>
              </div>
            </button>
          </div>
        )}
      </div>

      <main className={styles.main}>
        <div className={styles.sectionTitleRow}>
          <span className="material-symbols-outlined text-primary">home</span>
          <span className={styles.sectionTitle}>리워드 줍줍</span>
        </div>

        {/* 사용자 스탯 (RPG 스타일) */}
        <div className={styles.statsGrid}>
          <button
            type="button"
            className={styles.gradeCard}
            style={{
              backgroundImage: tierTheme.gradeCardBackground,
              backgroundColor: 'transparent',
              boxShadow: tierTheme.gradeCardShadow,
            }}
            onClick={handleGoMypage}
          >
            <div className={styles.gradeCardHeader}>
              <div className="flex flex-col">
                <div className={styles.gradeBadgeRow}>
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{
                      fontVariationSettings: "'FILL' 1",
                      color: tierTheme.badgeAccent,
                    }}
                  >
                    diamond
                  </span>
                  <span className={styles.gradeBadgeLabel} style={{ color: tierTheme.badgeAccent }}>
                    {rewardLoading ? '…' : tierLabelEn}
                  </span>
                </div>
                <span className={styles.gradeBenefit}>
                  XP {rewardMe != null ? rewardMe.cumulativeXp.toLocaleString('ko-KR') : rewardLoading ? '…' : '—'}
                </span>
              </div>
              <div className={styles.gradeAvatar}>
                <span
                  className="material-symbols-outlined text-3xl"
                  style={{ color: tierTheme.myAvatarIcon }}
                >
                  face_6
                </span>
              </div>
            </div>
            <p className={styles.gradeName}>{greetingName}님</p>
            <div className={styles.gradeProgressBar}>
              <div
                className={styles.gradeProgressFill}
                style={{
                  width: `${gradeProgressPercent}%`,
                  backgroundColor: tierTheme.progressFill,
                  boxShadow: tierTheme.progressGlow,
                  border: tierTheme.progressBorder,
                }}
              />
            </div>
            <div className={styles.gradeProgressLabels}>
              <span>
                {rewardMe != null
                  ? rewardMe.nextTierRequiredCount > 0
                    ? `다음 등급까지 ${rewardMe.orderCount} / ${ordersForNext}회`
                    : `누적 ${rewardMe.orderCount.toLocaleString('ko-KR')}회 · 최고 등급`
                  : rewardLoading
                    ? '불러오는 중…'
                    : !getAccessToken()
                      ? '로그인 후 확인'
                      : rewardFetchFailed
                        ? '리워드 정보를 불러오지 못했습니다'
                        : '—'}
              </span>
              {rewardMe != null && rewardMe.nextTierRequiredCount > 0 && (
                <span className="text-green-300 font-bold">남음 {rewardMe.nextTierRequiredCount}회</span>
              )}
            </div>
          </button>

          <div className={styles.missionColumn}>
            <button
              type="button"
              className={styles.distanceCard}
              onClick={handleGoMypage}
            >
              <div className={styles.distanceMeta}>
                <span className={styles.distanceLabel}>누적 도보 이동</span>
                <span className={styles.distanceValue}>
                  {distanceKm != null
                    ? `${distanceKm} km`
                    : rewardLoading
                      ? '…'
                      : '—'}
                </span>
              </div>
              <div className={styles.distanceBarWrapper}>
                <div className={styles.distanceBarFill} style={{ width: `${distanceBarPercent}%` }} />
                <div className={styles.distanceBarMarkers} aria-hidden>
                  <div className={styles.distanceCheckpoint} />
                  <div className={styles.distanceCheckpoint} />
                </div>
              </div>
            </button>
            <button
              type="button"
              className={styles.attendanceCard}
              onClick={handleAttendanceClick}
            >
              <div className={styles.attendanceStatus}>
                <span className={styles.attendanceLabel}>오늘의 출석</span>
                {attendanceDoneToday ? (
                  <div className="flex items-center gap-1 text-primary">
                    <span
                      className="material-symbols-outlined text-lg"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    <span className="text-xs font-bold">완료</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-400">
                    <span className="material-symbols-outlined text-lg">radio_button_unchecked</span>
                    <span className="text-xs font-bold">미완료</span>
                  </div>
                )}
              </div>
              <div className="border-t border-gray-50 my-1" />
              <div className="flex flex-col items-center">
                <span className={styles.attendanceLabel}>연속 출석</span>
                <p className="text-xs font-bold text-primary text-center leading-tight">
                  {!getAccessToken()
                    ? '로그인 후'
                    : attendanceStreak > 0
                      ? `${attendanceStreak}일째`
                      : '오늘 출석으로 시작'}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* 던전 카테고리 */}
        <div className={styles.sectionWrapper}>
          <div className={styles.sectionHeader}>
            <span className="material-symbols-outlined text-primary">grid_view</span>
            <span className={styles.sectionTitle}>던전 카테고리</span>
          </div>
          <div className={styles.categoryGrid}>
            {HOME_CATEGORIES.map((cat, idx) => (
              <button
                key={idx}
                className={styles.categoryButton}
                onClick={onCategoryClick}
              >
                <div className={styles.categoryIconWrapper}>
                  <span className="material-symbols-outlined text-3xl text-gray-700 group-hover:text-primary">{cat.icon}</span>
                </div>
                <span className="text-xs font-bold text-gray-600">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 던전 프로모션 배너 */}
        <div className={styles.promoWrapper}>
          <div className={styles.promoCard}>
            <div className="z-10">
              <span className={styles.promoChip}>새로운 미션</span>
              <p className={styles.promoTitle}>
                주말 한정 경험치 2배!
                <br />
                포장 시 추가 3,000G 할인
              </p>
            </div>
            <div className={styles.promoCircleBig} />
            <div className={styles.promoCircleSmall} />
            <div className={styles.promoIcon}>
              <span className="material-symbols-outlined text-white/80 text-4xl">auto_awesome</span>
            </div>
          </div>
        </div>

        {/* 지금 공략할 맛집 던전 */}
        <div className={styles.listSection}>
          <div className={styles.listHeader}>
            <div className={styles.listHeaderLeft}>
              <span className="text-lg">🔥</span>
              <span className={styles.listTitle}>지금 공략할 맛집 던전</span>
            </div>
            <button
              type="button"
              className={styles.listMoreButton}
              onClick={onCategoryClick}
            >
              전체보기
            </button>
          </div>

          <FeaturedRestaurantList
            restaurants={restaurants}
            onCardClick={(id) => onStoreSelect?.(id)}
          />
        </div>
      </main>

      {/* 하단 탭: 클릭 시 해당 페이지로 이동 */}
      <BottomNav active="home" cartCount={cartCount} onNavigate={(page) => {
        if (page === 'cart') onCartClick?.()
        if (page === 'orders') onOrdersClick?.()
        if (page === 'map') onMapClick?.()
        if (page === 'mypage') onMypageClick?.()
      }} />
    </Layout>
  )
}

export default HomePage
