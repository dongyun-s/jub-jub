/**
 * FavoritesPage.tsx
 * 찜 목록 페이지 (마이페이지 → 찜 목록)
 * - 찜한 매장 카드 리스트, 찜 해제, 매장 클릭 시 매장 상세로 이동
 */

import { useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout'
import BottomNav from '../../components/BottomNav'
import SimpleAlertModal from '../../components/SimpleAlertModal/SimpleAlertModal'
import { ApiError } from '../../api/authClient'
import { fetchMyFavorites, toggleStoreFavorite, type FavoriteStoreDto } from '../../api/favorites'
import styles from './FavoritesPage.module.css'

interface FavoritesPageProps {
  onBack?: () => void
  onGoHome?: () => void
  onCartClick?: () => void
  onOrdersClick?: () => void
  onMapClick?: () => void
  onMypageClick?: () => void
  onStoreClick?: (storeId: number) => void
  cartCount?: number
}

type FavoriteStore = FavoriteStoreDto

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
  const [favorites, setFavorites] = useState<FavoriteStore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    try {
      const list = await fetchMyFavorites()
      setFavorites(list)
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : '찜 목록을 불러오지 못했습니다.'
      setError(msg)
      setFavorites([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const handleToggleFavorite = (storeId: number) => {
    void (async () => {
      try {
        await toggleStoreFavorite(storeId)
        await refresh()
      } catch (e) {
        const msg =
          e instanceof ApiError ? e.message : '찜을 변경하지 못했습니다.'
        setError(msg)
      }
    })()
  }

  const activeFavorites = useMemo(() => favorites, [favorites])

  return (
    <Layout showBackground={false}>
      <div className={styles.root}>
        <SimpleAlertModal
          open={error != null}
          title="안내"
          message={error ?? ''}
          onClose={() => setError(null)}
        />
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

          {loading ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">찜 목록을 불러오는 중…</p>
          ) : activeFavorites.length > 0 ? (
            <div className={styles.list}>
              {activeFavorites.map((store) => (
                <div key={store.favoriteId} className={styles.card}>
                  <div className={styles.cardInner}>
                    <button onClick={() => onStoreClick?.(store.storeId)} className={styles.imageButton}>
                      <img
                        src={store.storeImageUrl}
                        alt={store.storeName}
                        className={styles.storeImage}
                      />
                    </button>
                    <div className={styles.info}>
                      <div className={styles.infoHeader}>
                        <button onClick={() => onStoreClick?.(store.storeId)} className={styles.nameButton}>
                          <h3 className={styles.storeName}>{store.storeName}</h3>
                          <p className={styles.category}>{store.categoryName}</p>
                        </button>
                        <button
                          onClick={() => handleToggleFavorite(store.storeId)}
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
                          {store.distance}m
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
                    <button onClick={() => onStoreClick?.(store.storeId)} className={styles.orderButton}>
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
