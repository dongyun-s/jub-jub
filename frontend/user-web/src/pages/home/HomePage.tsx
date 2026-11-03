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
import { useNearbyRestaurants } from '../../hooks/useStoreList'
import { useRankings } from '../../hooks/useRankings'
import { useUserLocation } from '../../hooks/useUserLocation'
import type { FeaturedRestaurant } from '../../constants'
import { HOME_CATEGORIES } from '../../constants'
import { resolveCategoryTheme } from '../../lib/mapCategoryMarkers'
import type { RankingEntryDto } from '../../api/ranking'
import { formatRankingStripDistanceKm, formatRankingStripMeta } from '../../lib/rankingDisplay'
import {
  clearLocalAttendanceMark,
  getAttendanceStreak,
  isAttendanceMarkedDone,
  isoDateLocal,
  markAttendanceDone,
  syncAttendanceStreakFromServer,
} from '../../lib/rewardAttendance'
import { useProfile } from '../../hooks/useProfile'
import { fetchAttendanceHistory, fetchRewardMe, type RewardMeResponse } from '../../api/rewards'
import { getAccessToken } from '../../lib/authStorage'
import { resolveDisplayImageUrl } from '../../lib/imageUrl'
import { LocationPermissionBanner } from '../../components/LocationPermissionBanner/LocationPermissionBanner'
import TierIcon from '../../components/TierIcon/TierIcon'
import { getTierLabelEn, getTierTheme } from '../../lib/rewardTierTheme'
import styles from './HomePage.module.css'

function RankingStripLine({ entry }: { entry: RankingEntryDto }) {
  return (
    <span className={styles.rankingStripItem}>
      <span className={styles.rankingStripRank}>{entry.rank}위</span>
      <TierIcon label={entry.tierLabel} size="xs" className={styles.rankingStripTier} alt="" />
      <span className={styles.rankingStripName}>{entry.nickname}</span>
      <span className={styles.rankingStripMeta}>
        {formatRankingStripDistanceKm(entry.walkingDistanceM)}
      </span>
    </span>
  )
}

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
  onRankingClick?: () => void
  /** 진행 중 주문이 있으면 상단 배너 표시 */
  hasActiveOrder?: boolean
  activeOrderLabel?: string
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
  onRankingClick,
  hasActiveOrder,
  activeOrderLabel,
  cartCount = 0,
}: HomePageProps) {
  const { profile } = useProfile()
  const [searchQuery, setSearchQuery] = useState('')
  const [restaurants, setRestaurants] = useState<FeaturedRestaurant[]>([])
  const { coords, loading: geoLoading, locationError, retry: retryLocation } = useUserLocation()
  const { restaurants: nearbyRestaurants, hint: nearbyHint } = useNearbyRestaurants(coords, geoLoading)
  const { entries: rankingEntries } = useRankings()
  const [rewardMe, setRewardMe] = useState<RewardMeResponse | null>(null)
  const [rewardLoading, setRewardLoading] = useState(false)
  const [rewardFetchFailed, setRewardFetchFailed] = useState(false)
  const [attendanceDoneToday, setAttendanceDoneToday] = useState(false)
  const [attendanceStreak, setAttendanceStreak] = useState(0)
  const [rankingCarouselIndex, setRankingCarouselIndex] = useState(0)

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
    if (!getAccessToken()) return
    const refetch = () => {
      void fetchRewardMe()
        .then((data) => {
          setRewardMe(data)
          setRewardFetchFailed(false)
        })
        .catch(() => setRewardFetchFailed(true))
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refetch()
    }
    window.addEventListener('jubjub-rewards-updated', refetch)
    window.addEventListener('focus', refetch)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('jubjub-rewards-updated', refetch)
      window.removeEventListener('focus', refetch)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [profile?.email])

  useEffect(() => {
    let cancelled = false

    const readAttendance = () => {
      if (typeof window === 'undefined') return
      setAttendanceDoneToday(isAttendanceMarkedDone(profile?.email))
      setAttendanceStreak(getAttendanceStreak(profile?.email))
    }

    const syncFromServer = async () => {
      if (!getAccessToken()) {
        readAttendance()
        return
      }
      const todayIso = isoDateLocal(new Date())
      try {
        const now = new Date()
        const history = await fetchAttendanceHistory({
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        })
        if (cancelled) return
        const serverToday = history.attendedDates.includes(todayIso)
        syncAttendanceStreakFromServer(profile?.email, history.attendedDates)
        if (serverToday) {
          markAttendanceDone(profile?.email)
        } else {
          clearLocalAttendanceMark(profile?.email, todayIso)
        }
        setAttendanceDoneToday(serverToday)
        setAttendanceStreak(getAttendanceStreak(profile?.email))
      } catch {
        if (!cancelled) readAttendance()
      }
    }

    void syncFromServer()
    const onRefresh = () => void syncFromServer()
    window.addEventListener('focus', onRefresh)
    window.addEventListener('jubjub-attendance-local', onRefresh)
    document.addEventListener('visibilitychange', onRefresh)
    return () => {
      cancelled = true
      window.removeEventListener('focus', onRefresh)
      window.removeEventListener('jubjub-attendance-local', onRefresh)
      document.removeEventListener('visibilitychange', onRefresh)
    }
  }, [profile?.email])

  useEffect(() => {
    if (nearbyRestaurants.length > 0) {
      setRestaurants(nearbyRestaurants)
    }
  }, [nearbyRestaurants])

  useEffect(() => {
    if (rankingEntries.length <= 1) return
    const timer = window.setInterval(() => {
      setRankingCarouselIndex((prev) => (prev + 1) % rankingEntries.length)
    }, 3000)
    return () => window.clearInterval(timer)
  }, [rankingEntries.length])

  const rankingDisplayEntry = rankingEntries[rankingCarouselIndex]

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

  const avatarResolved = profile?.profileImagePath?.trim()
    ? resolveDisplayImageUrl(profile.profileImagePath.trim())
    : ''
  const showAvatarImg =
    Boolean(avatarResolved) &&
    (avatarResolved.startsWith('http://') ||
      avatarResolved.startsWith('https://') ||
      avatarResolved.startsWith('data:'))

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
  const goToCategory = (tab: string) => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('categoryActiveTab', tab)
    }
    onCategoryClick?.()
  }

  const handleSearchSubmit = () => {
    const q = searchQuery.trim()
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('categorySearchQuery', q)
      window.sessionStorage.setItem('categoryActiveTab', '전체')
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

        {locationError && (
          <LocationPermissionBanner
            message={locationError}
            onRetry={() => void retryLocation()}
            loading={geoLoading}
          />
        )}

        {/* 진행 중인 주문 배너 */}
        {hasActiveOrder && (
          <div className={styles.activeOrderWrapper}>
            <button onClick={onOrderStatusClick} className={styles.activeOrderBanner}>
              <div className={styles.activeOrderIcon}>
                <span className="material-symbols-outlined text-white text-2xl">skillet</span>
              </div>
              <div className={styles.activeOrderText}>
                <p className={styles.activeOrderLabel}>주문 진행 중</p>
                <p className={styles.activeOrderTitle}>주문 내역 보기</p>
                <p className={styles.activeOrderTime}>{activeOrderLabel?.trim() || '진행 중인 주문'}</p>
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
          <div className={styles.sectionTitleLeft}>
            <span className="material-symbols-outlined text-primary">home</span>
            <span className={styles.sectionTitle}>리워드 줍줍</span>
          </div>
          <button
            type="button"
            className={styles.rankingStrip}
            onClick={() => onRankingClick?.()}
            aria-label={
              rankingDisplayEntry
                ? `회원 랭킹 ${formatRankingStripMeta(rankingDisplayEntry)}, 전체 보기`
                : '회원 랭킹 전체 보기'
            }
          >
            <span className={styles.rankingCarouselViewport} aria-live="polite">
              {rankingDisplayEntry ? (
                <RankingStripLine key={rankingCarouselIndex} entry={rankingDisplayEntry} />
              ) : null}
            </span>
            <span className={`material-symbols-outlined ${styles.rankingStripChevron}`}>chevron_right</span>
          </button>
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
                  <TierIcon
                    tier={rewardMe?.tier}
                    tierName={rewardMe?.tierName}
                    size="sm"
                    glow
                    alt=""
                  />
                  <span className={styles.gradeBadgeLabel} style={{ color: tierTheme.badgeAccent }}>
                    {rewardLoading ? '…' : tierLabelEn}
                  </span>
                </div>
                <span className={styles.gradeBenefit}>
                  {distanceKm != null
                    ? `도보 ${distanceKm}km`
                    : rewardLoading
                      ? '…'
                      : !getAccessToken()
                        ? '로그인 후 확인'
                        : '—'}
                </span>
              </div>
              <div className={styles.gradeAvatar}>
                {showAvatarImg ? (
                  <img src={avatarResolved} alt="" className={styles.gradeAvatarImg} />
                ) : (
                  <span
                    className="material-symbols-outlined text-3xl"
                    style={{ color: tierTheme.myAvatarIcon }}
                  >
                    face_6
                  </span>
                )}
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
            {HOME_CATEGORIES.map((cat, idx) => {
              const isMore = cat.label === '더보기'
              const theme = isMore ? null : resolveCategoryTheme(cat.label)
              return (
                <button
                  key={idx}
                  type="button"
                  className={styles.categoryButton}
                  onClick={() => goToCategory(isMore ? '전체' : cat.label)}
                >
                  <div
                    className={styles.categoryIconWrapper}
                    data-themed={theme ? 'true' : undefined}
                    style={
                      theme
                        ? ({
                            '--cat-from': theme.from,
                            '--cat-to': theme.to,
                            '--cat-glow': theme.glow,
                          } as React.CSSProperties)
                        : undefined
                    }
                  >
                    <span
                      className={`material-symbols-outlined text-3xl ${styles.categoryIcon}`}
                      style={theme ? { color: theme.to } : undefined}
                    >
                      {cat.icon}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold ${styles.categoryLabel}`}
                    style={theme ? { color: theme.to } : undefined}
                  >
                    {cat.label}
                  </span>
                </button>
              )
            })}
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
              onClick={() => goToCategory('전체')}
            >
              전체보기
            </button>
          </div>

          {nearbyHint && (
            <p className="px-4 pb-2 text-xs text-slate-500">{nearbyHint}</p>
          )}

          {restaurants.length > 0 ? (
            <FeaturedRestaurantList
              restaurants={restaurants}
              onCardClick={(id) => onStoreSelect?.(id)}
            />
          ) : (
            <div className={styles.listEmpty}>
              <span className={`material-symbols-outlined ${styles.listEmptyIcon}`}>storefront</span>
              <p className={styles.listEmptyTitle}>
                {geoLoading ? '주변 매장을 찾는 중이에요' : '주변에 표시할 매장이 없어요'}
              </p>
              <p className={styles.listEmptyDesc}>
                {geoLoading
                  ? '잠시만 기다려 주세요.'
                  : locationError
                    ? '위치(GPS) 권한을 허용하면 주변 매장을 볼 수 있어요.'
                    : '카테고리에서 매장을 찾아보세요.'}
              </p>
            </div>
          )}
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
