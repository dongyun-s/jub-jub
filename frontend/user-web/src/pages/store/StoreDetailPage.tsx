/**
 * StoreDetailPage.tsx
 * 매장 상세 페이지 (카테고리/지도에서 매장 선택 시)
 * - 히어로 이미지, 프로필·퀘스트 배너, 탭(메뉴/리뷰/매장정보), 카테고리·검색, 메뉴 카드 그리드
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import Layout from '../../components/Layout'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import { fetchStoreDetail } from '../../api/store'
import type { StoreDetailDto } from '../../api/store'
import { fetchStoreReviews, type ReviewDto } from '../../api/reviews'
import { ApiError } from '../../api/authClient'
import { toggleStoreFavorite } from '../../api/favorites'
import SimpleAlertModal from '../../components/SimpleAlertModal/SimpleAlertModal'
import NotificationIconButton from '../../components/NotificationIconButton/NotificationIconButton'
import { useUnreadNotificationCount } from '../../hooks/useUnreadNotificationCount'
import { getAccessToken } from '../../lib/authStorage'
import { normalizeReviewImageList, resolveDisplayImageUrl } from '../../lib/imageUrl'
import { STORE_LIST_CARD_IMAGES } from '../../constants'
import {
  buildMenuCategoriesFromApi,
  type MenuItem,
  type MenuCategory,
} from '../../lib/storeDetailMenu'
import { fetchRewardMe } from '../../api/rewards'
import { getTierDiscountRate } from '../../lib/rewardTierTheme'
import styles from './StoreDetailPage.module.css'

interface StoreDetailPageProps {
  storeId: number
  onBack: () => void
  onGoHome: () => void
  /** 메뉴 카드에서 넘기는 `menuId` (서버 메뉴 ID) */
  onMenuClick?: (menuId: number) => void
  onCartClick?: () => void
  onOrdersClick?: () => void
  onMapClick?: () => void
  onMypageClick?: () => void
  onFavoritesClick?: () => void
  onNotificationsClick?: () => void
  cartCount?: number
  /** 장바구니 합계 금액 (API 또는 로컬 합산) */
  cartTotalPrice?: number
}

/** 메뉴 아이템 카드 컴포넌트 */
function MenuItemCard({ 
  item, 
  formatPrice, 
  showRank = false,
  onClick 
}: { 
  item: MenuItem
  formatPrice: (price: number) => string
  showRank?: boolean
  onClick?: () => void 
}) {
  return (
    <button type="button" onClick={onClick} className={styles.menuCard}>
      <div className={styles.menuCardBg} />
      {(item.tags.length > 0 || (item.rank && showRank)) && (
        <div className={styles.menuCardTags}>
          {item.rank && showRank && (
            <span className={styles.menuCardRank}>🔥 인기 {item.rank}위</span>
          )}
          <div className={styles.menuCardTagRow}>
            {item.tags.includes('best') && <span className={styles.menuCardTagBest}>BEST</span>}
            {item.tags.includes('loot') && <span className={styles.menuCardTagLoot}>LOOT</span>}
          </div>
        </div>
      )}
      {item.image && (
        <div className={styles.menuCardImage} style={{ backgroundImage: `url("${item.image}")` }} />
      )}
      <div className={styles.menuCardInfo}>
        <div>
          <h4 className={styles.menuCardName}>
            {item.name}
            {item.isSoldOut ? ' (품절)' : ''}
          </h4>
          {item.description && <p className={styles.menuCardDesc}>{item.description}</p>}
        </div>
        <div className={styles.menuCardBottom}>
          <div className={styles.menuCardPriceWrap}>
            <span className={styles.menuCardPrice}>{formatPrice(item.price)}</span>
          </div>
          <div className={styles.menuCardAddBtn}>
            <span className="material-symbols-outlined">add</span>
          </div>
        </div>
      </div>
    </button>
  )
}

function StoreDetailPage({
  storeId,
  onBack,
  onGoHome,
  onMenuClick,
  onCartClick,
  onOrdersClick,
  onMapClick,
  onMypageClick,
  onFavoritesClick: _onFavoritesClick,
  onNotificationsClick,
  cartCount = 0,
  cartTotalPrice = 0,
}: StoreDetailPageProps) {
  const unreadNotificationCount = useUnreadNotificationCount()
  const [detail, setDetail] = useState<StoreDetailDto | null>(null)
  const [storeLoading, setStoreLoading] = useState(true)
  const [storeError, setStoreError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<'menu' | 'review' | 'info'>('menu')
  const [activeCategory, setActiveCategory] = useState('popular')
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [favError, setFavError] = useState<string | null>(null)

  const [storeReviews, setStoreReviews] = useState<ReviewDto[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsError, setReviewsError] = useState<string | null>(null)
  /** 내 등급 할인율 (%) — 백엔드 RewardTier 기준 */
  const [tierDiscountRate, setTierDiscountRate] = useState(0)

  const categoryScrollRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!getAccessToken()) {
      setTierDiscountRate(0)
      return
    }
    let cancelled = false
    const load = () => {
      void fetchRewardMe()
        .then((me) => {
          if (!cancelled) setTierDiscountRate(getTierDiscountRate(me.tier, me.tierName))
        })
        .catch(() => {
          if (!cancelled) setTierDiscountRate(0)
        })
    }
    load()
    window.addEventListener('jubjub-rewards-updated', load)
    return () => {
      cancelled = true
      window.removeEventListener('jubjub-rewards-updated', load)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setReviewsLoading(true)
    setReviewsError(null)
    void fetchStoreReviews(storeId)
      .then((list) => {
        if (!cancelled) setStoreReviews(list)
      })
      .catch((e) => {
        if (!cancelled) {
          setStoreReviews([])
          setReviewsError(
            e instanceof ApiError ? e.message : '리뷰를 불러오지 못했습니다.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [storeId])

  useEffect(() => {
    let cancelled = false
    setStoreLoading(true)
    setStoreError(null)
    fetchStoreDetail(storeId)
      .then((d) => {
        if (!cancelled) {
          setDetail(d)
          setStoreLoading(false)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setDetail(null)
          setStoreError(
            e instanceof ApiError ? e.message : '매장 정보를 불러오지 못했습니다.',
          )
          setStoreLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [storeId])

  const menuCategories = useMemo((): MenuCategory[] => {
    if (!detail?.menus?.length) return []
    return buildMenuCategoriesFromApi(detail.menus)
  }, [detail])

  useEffect(() => {
    const first = menuCategories[0]?.id
    if (first) setActiveCategory(first)
  }, [menuCategories])

  const heroImage =
    STORE_LIST_CARD_IMAGES[Math.abs(Number(storeId)) % STORE_LIST_CARD_IMAGES.length]
  const storeName = (detail?.name ?? '매장').trim()
  const addressLine = detail?.address?.trim() || '주소 정보 없음'
  const minOrderLabel = detail ? `${detail.minOrderAmount.toLocaleString()}원` : '—'
  const cookTimeLabel = detail ? `약 ${detail.cookingTimeMinutes}분` : '—'

  const tabs = [
    { id: 'menu', label: '메뉴' },
    { id: 'review', label: '리뷰' },
    { id: 'info', label: '매장 정보' },
  ] as const

  const formatPrice = (price: number) => price.toLocaleString() + '원'

  const reviewStats = useMemo(() => {
    const list = storeReviews
    if (!list.length) {
      return {
        avg: 0,
        count: 0,
        bars: [5, 4, 3, 2, 1].map((score) => ({ score, pct: 0 })),
      }
    }
    const ratings = list.map((r) => r.overallRating)
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length
    const counts = [5, 4, 3, 2, 1].map((score) =>
      list.filter((r) => r.overallRating === score).length,
    )
    const max = Math.max(1, ...counts)
    const bars = [5, 4, 3, 2, 1].map((score, idx) => ({
      score,
      pct: Math.round((counts[idx] / max) * 100),
    }))
    return { avg, count: list.length, bars }
  }, [storeReviews])

  // 카테고리 선택 시 해당 섹션으로 스크롤
  const handleCategoryClick = useCallback((categoryId: string, index: number) => {
    setActiveCategory(categoryId)
    
    // 카테고리 탭 중앙 정렬
    const container = categoryScrollRef.current
    if (container) {
      const buttons = container.querySelectorAll('button')
      const button = buttons[index + 1]
      if (button) {
        const containerWidth = container.offsetWidth
        const buttonLeft = (button as HTMLElement).offsetLeft
        const buttonWidth = (button as HTMLElement).offsetWidth
        container.scrollTo({
          left: buttonLeft - (containerWidth / 2) + (buttonWidth / 2),
          behavior: 'smooth'
        })
      }
    }

    // 해당 섹션으로 스크롤
    const section = sectionRefs.current.get(categoryId)
    if (section && scrollContainerRef.current) {
      const headerOffset = 140 // 헤더 + 카테고리 탭 높이
      const sectionTop = section.offsetTop - headerOffset
      scrollContainerRef.current.scrollTo({
        top: sectionTop,
        behavior: 'smooth'
      })
    }
  }, [])

  // 스크롤 시 현재 보이는 카테고리 감지
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const headerOffset = 160
      const scrollTop = container.scrollTop + headerOffset

      for (const category of menuCategories) {
        const section = sectionRefs.current.get(category.id)
        if (section) {
          const sectionTop = section.offsetTop
          const sectionBottom = sectionTop + section.offsetHeight

          if (scrollTop >= sectionTop && scrollTop < sectionBottom) {
            if (activeCategory !== category.id) {
              setActiveCategory(category.id)
              
              // 카테고리 탭도 중앙 정렬
              const tabContainer = categoryScrollRef.current
              if (tabContainer) {
                const index = menuCategories.findIndex(c => c.id === category.id)
                const buttons = tabContainer.querySelectorAll('button')
                const button = buttons[index + 1]
                if (button) {
                  const containerWidth = tabContainer.offsetWidth
                  const buttonLeft = (button as HTMLElement).offsetLeft
                  const buttonWidth = (button as HTMLElement).offsetWidth
                  tabContainer.scrollTo({
                    left: buttonLeft - (containerWidth / 2) + (buttonWidth / 2),
                    behavior: 'smooth'
                  })
                }
              }
            }
            break
          }
        }
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [activeCategory, menuCategories])

  // 검색 필터링
  const filteredItems = searchQuery
    ? menuCategories.flatMap(c => c.items).filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  return (
    <Layout showBackground={false}>
      <div className={styles.root}>
        <SimpleAlertModal
          open={favError != null}
          title="안내"
          message={favError ?? ''}
          onClose={() => setFavError(null)}
        />
        {storeError && (
          <p className="mx-4 mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900" role="alert">
            {storeError}
          </p>
        )}
        {storeLoading && (
          <p className="mx-4 mt-2 text-center text-xs text-gray-500">매장 정보 불러오는 중…</p>
        )}

        <Header
          showBack
          onBack={onBack}
          title={storeName}
          rightContent={
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.headerIconButton}
                onClick={() => {
                  if (typeof window === 'undefined' || typeof navigator === 'undefined') return
                  const url = window.location.href
                  if (navigator.share) {
                    navigator.share({ url, title: storeName }).catch(() => {})
                  } else if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(url).then(() => {
                      window.alert('현재 페이지 주소를 클립보드에 복사했어요.')
                    }).catch(() => {})
                  }
                }}
              >
                <span className="material-symbols-outlined">share</span>
              </button>
              <button
                type="button"
                className={styles.headerIconButton}
                onClick={() => {
                  if (!getAccessToken()) {
                    setFavError('로그인 후 찜할 수 있습니다.')
                    return
                  }
                  void (async () => {
                    try {
                      const msg = await toggleStoreFavorite(storeId)
                      // 서버 메시지 기반으로 UI 상태 동기화 (해제/등록)
                      if (msg.includes('해제')) setIsFavorite(false)
                      else if (msg.includes('찜')) setIsFavorite(true)
                      else setIsFavorite((prev) => !prev)
                    } catch (e) {
                      setFavError(
                        e instanceof ApiError ? e.message : '찜을 변경하지 못했습니다.',
                      )
                    }
                  })()
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    color: isFavorite ? 'var(--color-primary)' : undefined,
                    fontVariationSettings: isFavorite ? "'FILL' 1" : undefined,
                  }}
                >
                  favorite
                </span>
              </button>
              <NotificationIconButton
                unreadCount={unreadNotificationCount}
                onClick={() => onNotificationsClick?.()}
                className={styles.headerIconButton}
              />
            </div>
          }
        />

        <div ref={scrollContainerRef} className={styles.scrollArea}>
          <div
            className={styles.hero}
            style={{
              backgroundImage: `url("${heroImage}")`,
            }}
          >
            <div className={styles.heroOverlay} />
            <div className={styles.heroOverlay2} />
          </div>

          <div className={styles.profileCardWrap}>
            <div className={styles.profileCard}>
              <div className={styles.profileCardBg} />
              <div className={styles.profileRow}>
                <div>
                  <div className={styles.profileTitleRow}>
                    <h1 className={styles.storeName}>{storeName}</h1>
                    <span className={styles.verifiedBadge}>Verified</span>
                  </div>
                  <div className={styles.profileMeta}>
                    <span className={`material-symbols-outlined ${styles.starIcon}`}>star</span>
                    <span className={styles.profileRating}>
                      {reviewsLoading ? '…' : reviewStats.count > 0 ? reviewStats.avg.toFixed(1) : '—'}
                    </span>
                    <span>
                      {reviewsLoading
                        ? ''
                        : reviewStats.count > 0
                          ? `(${reviewStats.count}개 리뷰)`
                          : '(리뷰 없음)'}
                    </span>
                    <span className={styles.profileMetaDot}>•</span>
                    <span>{addressLine}</span>
                  </div>
                </div>
              </div>
              <div className={styles.statsRow}>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>최소주문</span>
                  <span className={styles.statValue}>{minOrderLabel}</span>
                </div>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>포장시간</span>
                  <span className={styles.statValue}>{cookTimeLabel}</span>
                </div>
                <div className={`${styles.statBox} ${styles.statBoxHighlight}`}>
                  <span className={`${styles.statLabel} ${styles.statLabelPrimary}`}>등급 할인</span>
                  <span className={styles.statValueGradient}>{tierDiscountRate}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.questBannerWrap}>
            <button
              type="button"
              className={styles.questBanner}
              onClick={() => onMypageClick?.()}
            >
              <div className={styles.questBannerContent}>
                <span className={`material-symbols-outlined ${styles.questIcon}`}>workspace_premium</span>
                <div>
                  <p className={styles.questTitle}>포장하고 등급 올리기</p>
                  <p className={styles.questSub}>포장 주문으로 등급을 올려보세요!</p>
                </div>
              </div>
              <span className={`material-symbols-outlined ${styles.questChevron}`}>chevron_right</span>
            </button>
          </div>

          <nav className={styles.navTabs}>
            <div className={styles.tabRow}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabButtonActive : styles.tabButtonInactive}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          {activeTab === 'menu' && (
            <div className={styles.menuPanel}>
              <div className={styles.categoryBar}>
                <div
                  ref={categoryScrollRef}
                  className={styles.categoryScroll}
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <button
                    type="button"
                    onClick={() => setShowSearch(!showSearch)}
                    className={`${styles.searchButton} ${showSearch ? styles.searchButtonActive : ''}`}
                  >
                    <span className="material-symbols-outlined">search</span>
                  </button>
                  {menuCategories.map((category, index) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategoryClick(category.id, index)}
                      className={`${styles.categoryButton} ${activeCategory === category.id ? styles.categoryButtonActive : styles.categoryButtonInactive}`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
                {showSearch && (
                  <div className={styles.searchWrap}>
                    <div className={styles.searchInputWrap}>
                      <span className={`material-symbols-outlined ${styles.searchInputIcon}`}>search</span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="메뉴 검색"
                        className={styles.searchInput}
                        autoFocus
                      />
                      {searchQuery && (
                        <button type="button" onClick={() => setSearchQuery('')}>
                          <span className={`material-symbols-outlined ${styles.searchInputIcon}`}>close</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {searchQuery ? (
                <div className={styles.searchResultsWrap}>
                  <h3 className={styles.searchResultsTitle}>검색 결과 ({filteredItems.length})</h3>
                  <div className={styles.searchResultsList}>
                    {filteredItems.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        formatPrice={formatPrice}
                        onClick={() => onMenuClick?.(item.id)}
                      />
                    ))}
                    {filteredItems.length === 0 && (
                      <div className={styles.searchEmpty}>
                        <span className={`material-symbols-outlined ${styles.searchEmptyIcon}`}>search_off</span>
                        <p className={styles.searchEmptyText}>검색 결과가 없습니다.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : menuCategories.length === 0 ? (
                <div className={styles.menuEmpty}>
                  <span className={`material-symbols-outlined ${styles.menuEmptyIcon}`}>restaurant_menu</span>
                  <p className={styles.menuEmptyTitle}>등록된 메뉴가 없어요</p>
                  <p className={styles.menuEmptyDesc}>매장에서 메뉴를 준비 중일 수 있어요.</p>
                </div>
              ) : (
                <div className={styles.menuDivide}>
                  {menuCategories.map((category) => (
                    <div
                      key={category.id}
                      ref={(el) => { if (el) sectionRefs.current.set(category.id, el) }}
                      className={styles.categorySection}
                    >
                      <div className={styles.categoryHeader}>
                        <div className={styles.categoryHeaderRow}>
                          <span className={`material-symbols-outlined ${styles.categoryIcon}`}>
                            {category.id === 'popular'
                              ? 'auto_awesome'
                              : category.id === 'main'
                                ? 'restaurant'
                                : category.id === 'all'
                                  ? 'restaurant_menu'
                                  : 'local_cafe'}
                          </span>
                          <h3 className={styles.categoryTitle}>
                            {category.id === 'popular' ? '가장 인기 있는 메뉴' : category.name}
                          </h3>
                        </div>
                        {category.description && <p className={styles.categoryDesc}>{category.description}</p>}
                      </div>
                      <div className={styles.menuList}>
                        {category.items.map((item) => (
                          <MenuItemCard
                            key={item.id}
                            item={item}
                            formatPrice={formatPrice}
                            showRank={category.id === 'popular'}
                            onClick={() => onMenuClick?.(item.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'review' && (
            <div className={styles.reviewTab}>
              {reviewsLoading ? (
                <p className="px-4 py-6 text-center text-sm text-slate-500">리뷰를 불러오는 중…</p>
              ) : reviewsError ? (
                <p className="px-4 py-6 text-center text-sm text-red-600">{reviewsError}</p>
              ) : (
                <>
                  <div className={styles.reviewSummary}>
                    <div className={styles.reviewSummaryLeft}>
                      <div className={styles.reviewScore}>
                        {reviewStats.count ? reviewStats.avg.toFixed(1) : '—'}
                      </div>
                      <div className={styles.reviewStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className="material-symbols-outlined"
                            style={{
                              fontVariationSettings: "'FILL' 1",
                              opacity: reviewStats.count && star <= Math.round(reviewStats.avg) ? 1 : 0.25,
                            }}
                          >
                            star
                          </span>
                        ))}
                      </div>
                      <p className={styles.reviewCountText}>
                        {reviewStats.count ? `${reviewStats.count}개의 리뷰` : '아직 리뷰가 없습니다'}
                      </p>
                    </div>
                    <div className={styles.reviewBars}>
                      {reviewStats.bars.map(({ score, pct }) => (
                        <div key={score} className={styles.reviewBarRow}>
                          <span className={styles.reviewBarLabel}>{score}점</span>
                          <div className={styles.reviewBarTrack}>
                            <div className={styles.reviewBarFill} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.reviewList}>
                    {storeReviews.map((rev) => {
                      const t = rev.tasteRating ?? rev.overallRating
                      const p = rev.packagingRating ?? rev.overallRating
                      const tm = rev.timeRating ?? rev.overallRating
                      const dt =
                        rev.createdAt != null
                          ? (() => {
                              const d = new Date(rev.createdAt)
                              return Number.isNaN(d.getTime())
                                ? String(rev.createdAt).slice(0, 10)
                                : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
                            })()
                          : ''
                      const imgs = normalizeReviewImageList(rev as unknown as Record<string, unknown>)
                      return (
                        <div key={rev.reviewId} className={styles.reviewItem}>
                          <div className={styles.reviewItemHeader}>
                            <div>
                              <p className={styles.reviewUser}>회원 리뷰</p>
                              <p className={styles.reviewMeta}>
                                음식 {Number(t).toFixed(1)} · 포장 {Number(p).toFixed(1)} · 픽업 {Number(tm).toFixed(1)}
                                {dt ? ` · ${dt}` : ''}
                              </p>
                            </div>
                            <div className={styles.reviewItemStars}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`material-symbols-outlined ${styles.reviewItemStarIcon} ${
                                    star <= rev.overallRating ? styles.reviewItemStarOn : styles.reviewItemStarOff
                                  }`}
                                >
                                  star
                                </span>
                              ))}
                            </div>
                          </div>
                          <p className={styles.reviewText}>{rev.content}</p>
                          {imgs.length > 0 && (
                            <div className={styles.reviewTagRow}>
                              {imgs.map((src, i) => {
                                const url = resolveDisplayImageUrl(src) || src
                                return (
                                <img
                                  key={i}
                                  src={url}
                                  alt=""
                                  className="h-16 w-16 rounded-lg object-cover"
                                />
                              )
                            })}
                            </div>
                          )}
                          {rev.ownerReply && (
                            <div className={styles.reviewOwnerReply}>
                              <div className={styles.reviewOwnerReplyHeader}>
                                <span className="material-symbols-outlined">subdirectory_arrow_right</span>
                                <strong>사장님 답글</strong>
                              </div>
                              <p className={styles.reviewOwnerReplyText}>{rev.ownerReply.content}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'info' && (
            <div className={styles.infoTab}>
              <div className={styles.infoSection}>
                <h3 className={styles.infoTitle}>원산지</h3>
                <p className={styles.infoText}>
                  {detail?.originInfo ??
                    '서버에서 불러오면 원산지 정보가 표시됩니다. 포장·테이크아웃 전문 매장입니다.'}
                </p>
              </div>

              <div className={styles.infoSection}>
                <h3 className={styles.infoTitle}>운영 시간</h3>
                <ul className={styles.infoList}>
                  <li>월–금: 11:00 ~ 21:00</li>
                  <li>토요일: 11:00 ~ 20:00</li>
                  <li>일요일/공휴일: 휴무</li>
                </ul>
              </div>

              <div className={styles.infoSection}>
                <h3 className={styles.infoTitle}>위치</h3>
                <p className={styles.infoText}>{detail?.address ?? addressLine}</p>
                {detail?.phoneNumber && (
                  <p className={styles.infoSubText}>전화 {detail.phoneNumber}</p>
                )}
              </div>

              <div className={styles.infoSection}>
                <h3 className={styles.infoTitle}>안내 사항</h3>
                <ul className={styles.infoList}>
                  <li>포장 주문만 가능하며, 매장 내 취식은 어려운 점 양해 부탁드립니다.</li>
                  <li>
                    모든 메뉴는 주문 후 바로 제조되며, 평균 준비 시간은 약 {detail?.cookingTimeMinutes ?? 15}분입니다.
                  </li>
                  <li>땅콩·견과류 알레르기가 있는 경우 주문 시 꼭 미리 말씀해주세요.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className={styles.cartFloating}>
          <button type="button" onClick={onCartClick} className={styles.cartButton}>
            <div className={styles.cartButtonLeft}>
              <div className={styles.cartIconWrap}>
                <span className="material-symbols-outlined">shopping_cart</span>
                <span className={styles.cartBadge}>{cartCount}</span>
              </div>
              <span>장바구니 보기</span>
            </div>
            <div className={styles.cartTotalWrap}>
              <span className={styles.cartTotalLabel}>합계</span>
              <span>{cartTotalPrice.toLocaleString()}원</span>
            </div>
          </button>
        </div>

        {/* 하단 네비게이션 */}
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
      </div>
    </Layout>
  )
}

export default StoreDetailPage
