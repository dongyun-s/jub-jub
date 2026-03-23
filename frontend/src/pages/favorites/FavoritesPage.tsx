/**
 * FavoritesPage.tsx
 * 찜 목록 페이지 (마이페이지 → 찜 목록)
 * - 찜한 매장 카드 리스트, 찜 해제, 매장 클릭 시 매장 상세로 이동
 */

import { useState } from 'react'
import Layout from '../../components/Layout'
import BottomNav from '../../components/BottomNav'
import styles from './FavoritesPage.module.css'

interface FavoritesPageProps {
  onBack?: () => void
  onGoHome?: () => void
  onCartClick?: () => void
  onOrdersClick?: () => void
  onMapClick?: () => void
  onMypageClick?: () => void
  onStoreClick?: () => void
  cartCount?: number
}

interface FavoriteStore {
  id: number
  name: string
  category: string
  rating: number
  reviewCount: number
  distance: string
  image: string
  tags: string[]
  isFavorite: boolean
}

/** 찜한 매장 목록 (데모) */
const mockFavorites: FavoriteStore[] = [
  {
    id: 1,
    name: '카페 네온 하이브',
    category: '카페',
    rating: 4.8,
    reviewCount: 324,
    distance: '350m',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop',
    tags: ['분위기 좋음', '디저트 맛집'],
    isFavorite: true,
  },
  {
    id: 2,
    name: '스타벅스 강남점',
    category: '카페',
    rating: 4.5,
    reviewCount: 1250,
    distance: '500m',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&h=200&fit=crop',
    tags: ['커피 맛집'],
    isFavorite: true,
  },
  {
    id: 3,
    name: '맛있는 치킨집',
    category: '치킨',
    rating: 4.7,
    reviewCount: 567,
    distance: '1.2km',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=200&h=200&fit=crop',
    tags: ['바삭바삭', '양많음'],
    isFavorite: true,
  },
  {
    id: 4,
    name: '건강한 샐러드',
    category: '샐러드',
    rating: 4.6,
    reviewCount: 189,
    distance: '800m',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop',
    tags: ['신선함', '다이어트'],
    isFavorite: true,
  },
]

function FavoritesPage({ 
  onBack, 
  onGoHome, 
  onCartClick, 
  onOrdersClick, 
  onMapClick, 
  onMypageClick,
  onStoreClick,
  cartCount = 0
}: FavoritesPageProps) {
  const [favorites, setFavorites] = useState<FavoriteStore[]>(mockFavorites)

  const handleToggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.map(store => 
        store.id === id 
          ? { ...store, isFavorite: !store.isFavorite }
          : store
      )
    )
  }

  const activeFavorites = favorites.filter(store => store.isFavorite)

  return (
    <Layout showBackground={false}>
      <div className={styles.root}>
        {/* 헤더 */}
        <header className={styles.header}>
          <button
            type="button"
            onClick={() => onBack?.()}
            className={styles.backButton}
          >
            <span className={`material-symbols-outlined ${styles.backIcon}`}>arrow_back</span>
          </button>
          <h1 className={styles.pageTitle}>찜 목록</h1>
        </header>

        {/* 스크롤 영역 */}
        <div className={styles.scrollArea}>
          <div className={styles.countBar}>
            <p className={styles.countText}>
              총 <span className={styles.countNum}>{activeFavorites.length}</span>개의 매장을 찜했어요
            </p>
          </div>

          {activeFavorites.length > 0 ? (
            <div className={styles.list}>
              {activeFavorites.map((store) => (
                <div key={store.id} className={styles.card}>
                  <div className={styles.cardInner}>
                    <button onClick={onStoreClick} className={styles.imageButton}>
                      <img
                        src={store.image}
                        alt={store.name}
                        className={styles.storeImage}
                      />
                    </button>
                    <div className={styles.info}>
                      <div className={styles.infoHeader}>
                        <button onClick={onStoreClick} className={styles.nameButton}>
                          <h3 className={styles.storeName}>{store.name}</h3>
                          <p className={styles.category}>{store.category}</p>
                        </button>
                        <button
                          onClick={() => handleToggleFavorite(store.id)}
                          className={styles.favButton}
                        >
                          <span className={`material-symbols-outlined ${styles.favIcon}`}>favorite</span>
                        </button>
                      </div>
                      <div className={styles.metaRow}>
                        <span className={styles.metaStar}>
                          <span className={`material-symbols-outlined ${styles.starIcon}`}>star</span>
                          <span className={styles.rating}>{store.rating}</span>
                          <span className={styles.reviewCount}>({store.reviewCount})</span>
                        </span>
                        <span className={styles.distanceWrap}>
                          <span className={`material-symbols-outlined ${styles.distanceIcon}`}>near_me</span>
                          {store.distance}
                        </span>
                      </div>
                      <div className={styles.tagsRow}>
                        {store.tags.map((tag) => (
                          <span key={tag} className={styles.tag}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button onClick={onStoreClick} className={styles.orderButton}>
                      주문하기
                    </button>
                    <button onClick={onMapClick} className={styles.mapButton}>
                      <span className={`material-symbols-outlined ${styles.mapIcon}`}>map</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <span className={`material-symbols-outlined ${styles.emptyIcon}`}>favorite</span>
              <p className={styles.emptyTitle}>찜한 매장이 없어요</p>
              <p className={styles.emptyDesc}>마음에 드는 매장을 찜해보세요!</p>
              <button onClick={onGoHome} className={styles.emptyCta}>
                매장 둘러보기
              </button>
            </div>
          )}
        </div>

        {/* 하단 네비게이션 */}
        <BottomNav 
          active="mypage" 
          cartCount={cartCount}
          onNavigate={(page) => {
            if (page === 'home') onGoHome?.()
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

export default FavoritesPage
