/**
 * StoreDetailPage.tsx
 * 매장 상세 페이지 (카테고리/지도에서 매장 선택 시)
 * - 히어로 이미지, 프로필·퀘스트 배너, 탭(메뉴/리뷰/매장정보), 카테고리·검색, 메뉴 카드 그리드
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import Layout from '../../components/Layout'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import styles from './StoreDetailPage.module.css'

interface StoreDetailPageProps {
  onBack: () => void
  onGoHome: () => void
  onMenuClick?: () => void
  onCartClick?: () => void
  onOrdersClick?: () => void
  onMapClick?: () => void
  onMypageClick?: () => void
  onFavoritesClick?: () => void
  cartCount?: number
}

interface MenuItem {
  id: number
  name: string
  description?: string
  price: number
  xp?: number
  image?: string
  tags: ('best' | 'loot')[]
  rank?: number
}

interface MenuCategory {
  id: string
  name: string
  description?: string
  items: MenuItem[]
}

/** 매장 메뉴 카테고리·아이템 (데모) */
const menuCategories: MenuCategory[] = [
  {
    id: 'popular',
    name: '인기 메뉴',
    description: '한 달간 주문수가 많고 만족도가 높은 메뉴에요.',
    items: [
      {
        id: 1,
        name: '프리미엄 줍줍 보울',
        description: '신선한 아보카도와 수비드 연어가 어우러진 줍줍의 시그니처 메뉴',
        price: 14900,
        xp: 50,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjgVhe4RpU1CvWptSpJUoVU6IWkiGA1oG3BmLNe5Fh1sqjYiPgkIXsrWt2H4SC5dcLQJ33jO4h7uzFoDzlUYa-JYGPjg2Y2v_QTMV3JO_zi-sgUddtwX3objPZO-BZlh1r7riAc1TBA-_wfa2OrkfucW-kowHakz8w_hY7kyQpNdG_iRxqxaoWSGyNOtHlh4UMMyAaivn4TQSa-9b8IBqAgKhCgY6EXsC2yjE9XfW7vCsoiet34uBobR72zX2MlHJFLMbdAUbkXguB',
        tags: ['best', 'loot'],
        rank: 1,
      },
      {
        id: 2,
        name: '아보카도 가든 샐러드',
        description: '숲의 버터 아보카도와 유기농 채소의 환상적인 만남',
        price: 12500,
        xp: 30,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBw4rxEQgBxqN4CKtcZuvBE2E5x0k4tDJ0mTNDdD4_iqdLuLsxMGpsoX9CamCeS01CVp6-imTUzpJVWUbNnQpKCxn8aA3DvjOGALM44rLFJdDCFCXe-5-UbGAgwNqS0OpmmwEsmd_5dJFJrvAiZ6Kco4thTfCjEHfV9HcH_CAEE5XNq6RBljD95QWJnhIDHabkXsOqpo_YdSafC7tLNC9HcDqa9aZz54iNTXpHSyt_PFKOoO6dRkwcjGtwapWVxNSzmMBeQKV1RPu6A',
        tags: ['best'],
        rank: 2,
      },
    ],
  },
  {
    id: 'main',
    name: '메인 메뉴',
    items: [
      {
        id: 3,
        name: '그릴드 치킨 스테이크',
        description: '부드러운 닭가슴살을 그릴에 구워 특제 소스와 함께',
        price: 15900,
        xp: 40,
        image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=200&h=200&fit=crop',
        tags: [],
      },
      {
        id: 4,
        name: '연어 포케 보울',
        description: '신선한 연어와 아보카도, 특제 간장 소스',
        price: 16900,
        xp: 45,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop',
        tags: ['loot'],
      },
      {
        id: 5,
        name: '불고기 라이스 보울',
        description: '달콤한 불고기와 신선한 야채의 조화',
        price: 13900,
        image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=200&h=200&fit=crop',
        tags: [],
      },
    ],
  },
  {
    id: 'side',
    name: '사이드 & 드링크',
    items: [
      {
        id: 6,
        name: '트러플 프렌치 프라이',
        description: '트러플 오일과 파마산 치즈를 곁들인 감자튀김',
        price: 6500,
        tags: [],
      },
      {
        id: 7,
        name: '수제 핑크 레모네이드',
        description: '상큼한 레몬과 자몽의 조화',
        price: 4500,
        tags: [],
      },
      {
        id: 8,
        name: '콤부차 (레몬/진저)',
        description: '건강한 발효 음료',
        price: 5000,
        xp: 10,
        tags: ['loot'],
      },
    ],
  },
]

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
          <h4 className={styles.menuCardName}>{item.name}</h4>
          {item.description && <p className={styles.menuCardDesc}>{item.description}</p>}
        </div>
        <div className={styles.menuCardBottom}>
          <div className={styles.menuCardPriceWrap}>
            <span className={styles.menuCardPrice}>{formatPrice(item.price)}</span>
            {item.xp && (
              <div className={styles.menuCardXp}>
                <span className={`material-symbols-outlined ${styles.menuCardXpIcon}`}>bolt</span>
                <span className={styles.menuCardXpText}>+{item.xp} XP</span>
              </div>
            )}
          </div>
          <div className={styles.menuCardAddBtn}>
            <span className="material-symbols-outlined">add</span>
          </div>
        </div>
      </div>
    </button>
  )
}

function StoreDetailPage({ onBack, onGoHome, onMenuClick, onCartClick, onOrdersClick, onMapClick, onMypageClick, onFavoritesClick: _onFavoritesClick, cartCount = 0 }: StoreDetailPageProps) {
  const [activeTab, setActiveTab] = useState<'menu' | 'review' | 'info'>('menu')
  const [activeCategory, setActiveCategory] = useState('popular')
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [cartTotal] = useState(27400)
  const [isFavorite, setIsFavorite] = useState(false)

  const categoryScrollRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const tabs = [
    { id: 'menu', label: '메뉴' },
    { id: 'review', label: '리뷰' },
    { id: 'info', label: '매장 정보' },
  ] as const

  const formatPrice = (price: number) => price.toLocaleString() + '원'

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
  }, [activeCategory])

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
        <Header
          showBack
          onBack={onBack}
          title="줍줍 (Jub-Jub)"
          rightContent={
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.headerIconButton}
                onClick={() => {
                  if (typeof window === 'undefined' || typeof navigator === 'undefined') return
                  const url = window.location.href
                  if (navigator.share) {
                    navigator.share({ url, title: '줍줍 (Jub-Jub)' }).catch(() => {})
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
                  setIsFavorite((prev) => !prev)
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
            </div>
          }
        />

        <div ref={scrollContainerRef} className={styles.scrollArea}>
          <div
            className={styles.hero}
            style={{
              backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDCngcYIep9C9BP9oAIy2pBl2ogkuZ5baHG_sVSzCNdHOEmoo8ptcW4RFfaQ9IHqWVxuZJFpW-WSA08f563ET9J7_T5o1GpZ7Iq5DLuqEy-V8Y7DqdbRE-wEgqvC32NhtlOns7c-I-VvHyvnCmHQRoJfOWq7OSjZuVwvJT4WVyNRTVOJjUALvG82KsjU4Fb54qGni0T-wcI9OeBuna5mLxle-gzF2R94FwufBbqDiON1TGT7CE1YcLizGmlFJ2mjehcBqInzazNV8ZS')`,
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
                    <h1 className={styles.storeName}>줍줍 (Jub-Jub)</h1>
                    <span className={styles.verifiedBadge}>Verified</span>
                  </div>
                  <div className={styles.profileMeta}>
                    <span className={`material-symbols-outlined ${styles.starIcon}`}>star</span>
                    <span className={styles.profileRating}>4.8</span>
                    <span>(500+ 리뷰)</span>
                    <span className={styles.profileMetaDot}>•</span>
                    <span>서울시 강남구 역삼동</span>
                  </div>
                </div>
              </div>
              <div className={styles.statsRow}>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>최소주문</span>
                  <span className={styles.statValue}>12,000원</span>
                </div>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>포장시간</span>
                  <span className={styles.statValue}>10-15분</span>
                </div>
                <div className={`${styles.statBox} ${styles.statBoxHighlight}`}>
                  <span className={`${styles.statLabel} ${styles.statLabelPrimary}`}>포장 할인</span>
                  <span className={styles.statValueGradient}>10%</span>
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
                      <MenuItemCard key={item.id} item={item} formatPrice={formatPrice} onClick={onMenuClick} />
                    ))}
                    {filteredItems.length === 0 && (
                      <div className={styles.searchEmpty}>
                        <span className={`material-symbols-outlined ${styles.searchEmptyIcon}`}>search_off</span>
                        <p className={styles.searchEmptyText}>검색 결과가 없습니다.</p>
                      </div>
                    )}
                  </div>
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
                            {category.id === 'popular' ? 'auto_awesome' : category.id === 'main' ? 'restaurant' : 'local_cafe'}
                          </span>
                          <h3 className={styles.categoryTitle}>
                            {category.id === 'popular' ? '가장 인기 있는 메뉴' : category.name}
                          </h3>
                        </div>
                        {category.description && <p className={styles.categoryDesc}>{category.description}</p>}
                      </div>
                      <div className={styles.menuList}>
                        {category.items.map((item) => (
                          <MenuItemCard key={item.id} item={item} formatPrice={formatPrice} showRank={category.id === 'popular'} onClick={onMenuClick} />
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
              <div className={styles.reviewSummary}>
                <div className={styles.reviewSummaryLeft}>
                  <div className={styles.reviewScore}>4.8</div>
                  <div className={styles.reviewStars}>
                    <span className="material-symbols-outlined">star</span>
                    <span className="material-symbols-outlined">star</span>
                    <span className="material-symbols-outlined">star</span>
                    <span className="material-symbols-outlined">star</span>
                    <span className="material-symbols-outlined">star_half</span>
                  </div>
                  <p className={styles.reviewCountText}>500+개의 리뷰</p>
                </div>
                <div className={styles.reviewBars}>
                  {[5, 4, 3, 2, 1].map((score) => (
                    <div key={score} className={styles.reviewBarRow}>
                      <span className={styles.reviewBarLabel}>{score}점</span>
                      <div className={styles.reviewBarTrack}>
                        <div
                          className={styles.reviewBarFill}
                          style={{ width: score === 5 ? '70%' : score === 4 ? '20%' : score === 3 ? '7%' : '3%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.reviewList}>
                <div className={styles.reviewItem}>
                  <div className={styles.reviewItemHeader}>
                    <div>
                      <p className={styles.reviewUser}>전설의 미식가</p>
                      <p className={styles.reviewMeta}>음식 5.0 · 포장 5.0 · 픽업 4.5 · 2026.03.10</p>
                    </div>
                    <div className={styles.reviewItemStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`material-symbols-outlined ${styles.reviewItemStarIcon} ${
                            star <= 5 ? styles.reviewItemStarOn : styles.reviewItemStarOff
                          }`}
                        >
                          star
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className={styles.reviewText}>
                    포장인데도 샐러드가 전혀 눅눅하지 않고 식감이 살아있어요. 재료도 신선하고 소스도 너무 짜지 않아서
                    자주 시키게 되는 곳이에요.
                  </p>
                  <div className={styles.reviewTagRow}>
                    <span className={styles.reviewTag}>재료가 신선해요</span>
                    <span className={styles.reviewTag}>포장이 깔끔해요</span>
                  </div>
                </div>

                <div className={styles.reviewItem}>
                  <div className={styles.reviewItemHeader}>
                    <div>
                      <p className={styles.reviewUser}>샐러드성애자</p>
                      <p className={styles.reviewMeta}>음식 4.5 · 포장 4.0 · 픽업 4.5 · 2026.03.08</p>
                    </div>
                    <div className={styles.reviewItemStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`material-symbols-outlined ${styles.reviewItemStarIcon} ${
                            star <= 4 ? styles.reviewItemStarOn : styles.reviewItemStarOff
                          }`}
                        >
                          star
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className={styles.reviewText}>
                    양이 생각보다 많아서 한 끼 든든하게 먹을 수 있어요. 소스 선택지가 더 많으면 좋을 것 같지만,
                    기본 소스도 충분히 맛있습니다.
                  </p>
                  <div className={styles.reviewTagRow}>
                    <span className={styles.reviewTag}>양이 많아요</span>
                    <span className={styles.reviewTag}>가성비 좋아요</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'info' && (
            <div className={styles.infoTab}>
              <div className={styles.infoSection}>
                <h3 className={styles.infoTitle}>매장 소개</h3>
                <p className={styles.infoText}>
                  줍줍 (Jub-Jub)은 신선한 재료로 만드는 샐러드·보울 전문 매장입니다. 모든 메뉴는 포장·테이크아웃에
                  최적화되어 있어, 바쁜 일상 속에서도 가볍게 건강한 한 끼를 즐길 수 있어요.
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
                <p className={styles.infoText}>서울시 강남구 역삼동 123-45, 1층 줍줍 (Jub-Jub)</p>
                <p className={styles.infoSubText}>2호선 강남역 11번 출구에서 도보 5분 거리</p>
              </div>

              <div className={styles.infoSection}>
                <h3 className={styles.infoTitle}>안내 사항</h3>
                <ul className={styles.infoList}>
                  <li>포장 주문만 가능하며, 매장 내 취식은 어려운 점 양해 부탁드립니다.</li>
                  <li>모든 메뉴는 주문 후 바로 제조되며, 평균 준비 시간은 10–15분입니다.</li>
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
              <span>{cartTotal.toLocaleString()}원</span>
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
