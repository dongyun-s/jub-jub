/**
 * CategoryDetailPage.tsx
 * 카테고리 상세 페이지 (홈에서 카테고리 클릭 시)
 * - 상단 탭(한식/중식/…), 필터(거리순/평점순/포장할인), 가로 드래그 스크롤, 맛집 카드 리스트
 * - 상단 검색창에서 매장명 검색
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Layout from '../../components/Layout'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import FeaturedRestaurantList from '../../components/FeaturedRestaurantList'
import SearchBar from '../../components/SearchBar'
import { useDragScroll } from '../../hooks'
import { CATEGORY_TABS, FEATURED_RESTAURANTS, FILTER_OPTIONS } from '../../constants'
import styles from './CategoryDetailPage.module.css'

interface CategoryDetailPageProps {
  onBack: () => void
  onGoHome: () => void
  onStoreClick?: () => void
  onCartClick?: () => void
  onOrdersClick?: () => void
  onMapClick?: () => void
  onMypageClick?: () => void
  onFavoritesClick?: () => void
  cartCount?: number
}

/** 홈과 동일한 맛집 던전 데이터 사용 */
const restaurants = FEATURED_RESTAURANTS

function CategoryDetailPage({ onBack, onGoHome, onStoreClick, onCartClick, onOrdersClick, onMapClick, onMypageClick, onFavoritesClick, cartCount = 0 }: CategoryDetailPageProps) {
  const [activeTab, setActiveTab] = useState('전체')
  const [sortOrder, setSortOrder] = useState<'default' | 'distance' | 'rating'>('default')
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { scrollRef, isDragging, handlers } = useDragScroll()
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  // 선택된 탭을 중앙으로 스크롤
  const scrollToCenter = useCallback((tab: string) => {
    const container = scrollRef.current
    const button = tabRefs.current.get(tab)
    if (!container || !button) return

    const containerWidth = container.offsetWidth
    const buttonLeft = button.offsetLeft
    const buttonWidth = button.offsetWidth
    const scrollPosition = buttonLeft - (containerWidth / 2) + (buttonWidth / 2)
    
    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    })
  }, [scrollRef])

  // 탭 선택 핸들러
  const handleTabClick = useCallback((tab: string) => {
    if (isDragging) return
    setActiveTab(tab)
    scrollToCenter(tab)
  }, [isDragging, scrollToCenter])

  // 홈 검색에서 넘어온 검색어가 있으면 초기값으로 설정
  useEffect(() => {
    if (typeof window === 'undefined') return
    const q = window.sessionStorage.getItem('categorySearchQuery')
    if (q) {
      setSearchQuery(q)
      window.sessionStorage.removeItem('categorySearchQuery')
    }
  }, [])

  const filteredRestaurants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const base = !q ? restaurants : restaurants.filter((item) =>
      item.title.toLowerCase().includes(q) ||
      item.hashtags.some((h) => h.toLowerCase().includes(q.replace('#', '')))
    )

    const sorted = [...base]
    if (sortOrder === 'rating') {
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    }
    // distance 정렬은 실제 거리 필드가 생기면 그때 구현

    return sorted
  }, [searchQuery, sortOrder])

  return (
    <Layout showBackground={false}>
      <Header showBack onBack={onBack} onFavoriteClick={onFavoritesClick} />

      {/* 검색 영역 - 홈과 동일한 SearchBar 사용 */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="공략할 맛집 던전을 검색하세요!"
      />

      {/* 카테고리 탭 - 마우스 드래그 스크롤 */}
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
              ref={(el) => { if (el) tabRefs.current.set(tab, el) }}
              onClick={() => handleTabClick(tab)}
              className={`${styles.tabButton} ${activeTab === tab ? styles.tabButtonActive : styles.tabButtonInactive}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 필터 버튼 */}
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

      {/* 맛집 리스트 - 홈과 동일한 FeaturedRestaurantList 사용 */}
      <main className={styles.main}>
        <FeaturedRestaurantList
          restaurants={filteredRestaurants}
          onCardClick={() => onStoreClick?.()}
        />
      </main>

      <BottomNav active="home" cartCount={cartCount} onNavigate={(page) => {
        if (page === 'home') onGoHome()
        if (page === 'cart') onCartClick?.()
        if (page === 'orders') onOrdersClick?.()
        if (page === 'map') onMapClick?.()
        if (page === 'mypage') onMypageClick?.()
      }} />
    </Layout>
  )
}

export default CategoryDetailPage
