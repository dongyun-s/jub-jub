/**
 * CategoryDetailPage.tsx
 * 카테고리 상세 — 정렬(기본/거리/평점)은 useStoreList 훅 경유 (실 API)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Layout from '../../components/Layout'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import FeaturedRestaurantList from '../../components/FeaturedRestaurantList'
import { LocationPermissionBanner } from '../../components/LocationPermissionBanner/LocationPermissionBanner'
import SearchBar from '../../components/SearchBar'
import { useDragScroll } from '../../hooks'
import { useStoreList } from '../../hooks/useStoreList'
import { useUserLocation } from '../../hooks/useUserLocation'
import type { FeaturedRestaurant } from '../../constants'
import { CATEGORY_TABS, FILTER_OPTIONS } from '../../constants'
import { restaurantMatchesCategoryTab } from '../../lib/storeUi'
import styles from './CategoryDetailPage.module.css'

interface CategoryDetailPageProps {
  onBack: () => void
  onGoHome: () => void
  onStoreSelect?: (storeId: number) => void
  onCartClick?: () => void
  onOrdersClick?: () => void
  onMapClick?: () => void
  onMypageClick?: () => void
  onFavoritesClick?: () => void
  onNotificationsClick?: () => void
  cartCount?: number
}

function CategoryDetailPage({
  onBack,
  onGoHome,
  onStoreSelect,
  onCartClick,
  onOrdersClick,
  onMapClick,
  onMypageClick,
  onFavoritesClick,
  onNotificationsClick,
  cartCount = 0,
}: CategoryDetailPageProps) {
  const [activeTab, setActiveTab] = useState('전체')
  const [sortOrder, setSortOrder] = useState<'default' | 'distance' | 'rating'>('default')
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { coords, loading: geoLoading, locationError, retry: retryLocation } = useUserLocation()
  const { restaurants, loading: storesLoading, hint: storeListHint, error: storeListError } = useStoreList({
    activeTab,
    sortOrder,
    coords,
    geoLoading,
  })
  const { scrollRef, isDragging, shouldIgnoreClick, handlers } = useDragScroll()
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const scrollToCenter = useCallback((tab: string) => {
    const container = scrollRef.current
    const button = tabRefs.current.get(tab)
    if (!container || !button) return

    const containerWidth = container.offsetWidth
    const buttonLeft = button.offsetLeft
    const buttonWidth = button.offsetWidth
    const scrollPosition = buttonLeft - containerWidth / 2 + buttonWidth / 2

    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth',
    })
  }, [scrollRef])

  const handleTabClick = useCallback(
    (tab: string) => {
      if (shouldIgnoreClick()) return
      setActiveTab(tab)
      scrollToCenter(tab)
    },
    [shouldIgnoreClick, scrollToCenter],
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const q = window.sessionStorage.getItem('categorySearchQuery')
    if (q) {
      setSearchQuery(q)
      window.sessionStorage.removeItem('categorySearchQuery')
    }
    const tab = window.sessionStorage.getItem('categoryActiveTab')
    if (tab && CATEGORY_TABS.includes(tab)) {
      setActiveTab(tab)
      window.sessionStorage.removeItem('categoryActiveTab')
    }
  }, [])

  const filteredRestaurants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const bySearch = !q
      ? restaurants
      : restaurants.filter(
          (item: FeaturedRestaurant) =>
            item.title.toLowerCase().includes(q) ||
            item.hashtags.some((h) => h.toLowerCase().includes(q.replace('#', ''))),
        )
    return bySearch.filter((item) => restaurantMatchesCategoryTab(activeTab, item))
  }, [searchQuery, activeTab, restaurants])

  return (
    <Layout showBackground={false}>
      <Header
        showBack
        onBack={onBack}
        onFavoriteClick={onFavoritesClick}
        onNotificationsClick={onNotificationsClick}
      />

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="공략할 맛집 던전을 검색하세요!"
      />

      {locationError && (sortOrder === 'distance' || sortOrder === 'rating') && (
        <LocationPermissionBanner
          message={locationError}
          onRetry={() => void retryLocation()}
          loading={geoLoading}
        />
      )}

      <div className={styles.tabWrapper}>
        <div
          ref={scrollRef}
          className={`${styles.tabScroll} ${isDragging ? styles.tabScrollGrabbing : styles.tabScrollGrab}`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          {...handlers}
        >
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab}
              ref={(el) => {
                if (el) tabRefs.current.set(tab, el)
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => handleTabClick(tab)}
              className={`${styles.tabButton} ${activeTab === tab ? styles.tabButtonActive : styles.tabButtonInactive}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.sortDropdown}>
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => {
                setIsSortDropdownOpen((prev) => !prev)
              }}
              className={`${styles.filterButton} ${sortOrder === 'default' ? styles.filterButtonInactive : styles.filterButtonActive}`}
            >
              <span>
                {sortOrder === 'default' && '기본순'}
                {sortOrder === 'distance' && '거리순'}
                {sortOrder === 'rating' && '평점순'}
              </span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
          ))}

          {isSortDropdownOpen && (
            <div className={styles.sortDropdownMenu}>
              <button
                type="button"
                className={styles.sortDropdownItem}
                onClick={() => {
                  setSortOrder('default')
                  setIsSortDropdownOpen(false)
                }}
              >
                기본순
              </button>
              <button
                type="button"
                className={styles.sortDropdownItem}
                onClick={() => {
                  setSortOrder('distance')
                  setIsSortDropdownOpen(false)
                }}
              >
                거리순
              </button>
              <button
                type="button"
                className={styles.sortDropdownItem}
                onClick={() => {
                  setSortOrder('rating')
                  setIsSortDropdownOpen(false)
                }}
              >
                평점순
              </button>
            </div>
          )}
        </div>
      </div>

      <main className={styles.main}>
        {storeListError && !storesLoading && (
          <p className="px-4 pb-2 text-center text-xs text-red-600">{storeListError}</p>
        )}
        {storeListHint && !storesLoading && !storeListError && (
          <p className="px-4 pb-2 text-center text-xs text-slate-500">{storeListHint}</p>
        )}
        {storesLoading && (
          <p className="px-4 py-6 text-center text-sm text-slate-500">매장을 불러오는 중…</p>
        )}
        {!storesLoading && filteredRestaurants.length === 0 && (
          <p className="px-4 py-12 text-center text-sm text-slate-500">
            이 카테고리에 해당하는 매장이 없습니다.
          </p>
        )}
        <FeaturedRestaurantList
          restaurants={filteredRestaurants}
          onCardClick={(id) => onStoreSelect?.(id)}
        />
      </main>

      <BottomNav
        active="home"
        cartCount={cartCount}
        onNavigate={(page) => {
          if (page === 'home') onGoHome()
          if (page === 'cart') onCartClick?.()
          if (page === 'orders') onOrdersClick?.()
          if (page === 'map') onMapClick?.()
          if (page === 'mypage') onMypageClick?.()
        }}
      />
    </Layout>
  )
}

export default CategoryDetailPage
