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
import styles from './HomePage.module.css'

interface HomePageProps {
  onCategoryClick?: () => void
  onCartClick?: () => void
  onOrdersClick?: () => void
  onOrderStatusClick?: () => void
  onMapClick?: () => void
  onMypageClick?: () => void
  onFavoritesClick?: () => void
  /** 매장 카드 선택 시 storeId 전달 */
  onStoreSelect?: (storeId: number) => void
  /** 진행 중 주문이 있으면 상단 배너 표시 */
  hasActiveOrder?: boolean
  cartCount?: number
}

// 홈 상단 카드용 오늘 출석 여부 (디자인 확인용 데모 플래그)
const isTodayCheckedInHome = false

function HomePage({
  onCategoryClick,
  onCartClick,
  onOrdersClick,
  onOrderStatusClick,
  onMapClick,
  onMypageClick,
  onFavoritesClick,
  onStoreSelect,
  hasActiveOrder,
  cartCount = 0,
}: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [restaurants, setRestaurants] = useState<FeaturedRestaurant[]>(FEATURED_RESTAURANTS)

  useEffect(() => {
    let cancelled = false
    fetchStores()
      .then((list) => {
        if (!cancelled && list.length > 0) {
          setRestaurants(list.map(mapStoreListItemToFeatured))
        }
      })
      .catch(() => {
        /* 토큰/네트워크 실패 시 기존 데모 목록 유지 */
      })
    return () => {
      cancelled = true
    }
  }, [])

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
      <Header onFavoriteClick={onFavoritesClick} />

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
            onClick={handleGoMypage}
          >
            <div className={styles.gradeCardHeader}>
              <div className="flex flex-col">
                <div className={styles.gradeBadgeRow}>
                  <span
                    className="material-symbols-outlined text-cyan-300 text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    diamond
                  </span>
                  <span className={styles.gradeBadgeLabel}>다이아</span>
                </div>
                <span className={styles.gradeBenefit}>7% 할인</span>
              </div>
              <div className={styles.gradeAvatar}>
                <span className="material-symbols-outlined text-primary text-3xl">face_6</span>
              </div>
            </div>
            <p className={styles.gradeName}>미식가 쭈쭈님</p>
            <div className={styles.gradeProgressBar}>
              <div className={styles.gradeProgressFill} style={{ width: '85%' }} />
            </div>
            <div className={styles.gradeProgressLabels}>
              <span>👑 레전드까지 85 / 100회</span>
              <span className="text-green-300 font-bold">+15회</span>
            </div>
          </button>

          <div className={styles.missionColumn}>
            <button
              type="button"
              className={styles.distanceCard}
              onClick={handleGoMypage}
            >
              <div className={styles.distanceMeta}>
                <span className={styles.distanceLabel}>다음 보상: 5km 쿠폰</span>
                <span className={styles.distanceValue}>1.2km 남음</span>
              </div>
              <div className={styles.distanceBarWrapper}>
                <div className={styles.distanceBarFill} style={{ width: '76%' }} />
                <div className={styles.distanceCheckpoint} />
              </div>
            </button>
            <button
              type="button"
              className={styles.attendanceCard}
              onClick={handleAttendanceClick}
            >
              <div className={styles.attendanceStatus}>
                <span className={styles.attendanceLabel}>오늘의 출석</span>
                {isTodayCheckedInHome ? (
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
                <p className="text-xs font-bold text-primary">12일째</p>
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
