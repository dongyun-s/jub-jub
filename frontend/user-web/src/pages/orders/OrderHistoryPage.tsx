/**
 * OrderHistoryPage.tsx
 * 주문 내역 페이지 (탭: 주문내역)
 * - 최근 주문 / 과거 주문 탭, 주문 카드(리뷰 쓰기 버튼), 검색, 하단 네비
 */

import { useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import { FEATURED_RESTAURANTS } from '../../constants'
import { getMyOrders, type MyOrderItem } from '../../api/orders'
import type { ReviewWritePayload } from '../../api/reviews'
import { ApiError } from '../../api/authClient'
import styles from './OrderHistoryPage.module.css'

interface OrderHistoryPageProps {
  onBack?: () => void
  onGoHome: () => void
  onCartClick?: () => void
  onOrderStatusClick?: () => void
  onMapClick?: () => void
  onMypageClick?: () => void
  onFavoritesClick?: () => void
  onNotificationsClick?: () => void
  /** 리뷰 쓰기 클릭 시 주문·매장 정보 전달 후 리뷰 작성 페이지로 이동 */
  onReviewWriteClick?: (payload: ReviewWritePayload) => void
  hasActiveOrder?: boolean
  cartCount?: number
}

interface OrderItem {
  id: number
  storeId: number
  storeName: string
  date: string
  menu: string
  price: number
  xp: number
  distance: string
  image: string
  status: 'completed' | 'reviewed'
}

/** 매장명만 알 때 서버 storeId 추정 (데모·구버전 주문 API 호환) */
function resolveStoreIdFromFeatured(storeName: string): number {
  const hit = FEATURED_RESTAURANTS.find(
    (r) =>
      storeName.includes(r.title) ||
      r.title.includes(storeName.trim().slice(0, Math.min(6, storeName.trim().length)))
  )
  return hit?.id ?? FEATURED_RESTAURANTS[0].id
}

type LocalOrder = {
  orderId: number
  storeId: number
  storeName: string
  menuSummary: string
  finalAmount?: number
  totalAmount?: number
  image?: string | null
  createdAt: string
  paymentStatus?: string
  paidAt?: string | null
}

/** 최근 주문 목록 (데모) */
const recentOrders: OrderItem[] = [
  {
    id: 1,
    storeId: resolveStoreIdFromFeatured('스타벅스 강남점'),
    storeName: '스타벅스 강남점',
    date: '2023.10.25',
    menu: '아이스 아메리카노 외 1건',
    price: 12500,
    xp: 50,
    distance: '1.2km',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&h=200&fit=crop',
    status: 'completed',
  },
  {
    id: 2,
    storeId: resolveStoreIdFromFeatured('도미노피자 역삼점'),
    storeName: '도미노피자 역삼점',
    date: '2023.10.22',
    menu: '페퍼로니 피자 L',
    price: 24900,
    xp: 120,
    distance: '2.5km',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop',
    status: 'reviewed',
  },
  {
    id: 3,
    storeId: resolveStoreIdFromFeatured('쉑쉑버거 신논현'),
    storeName: '쉑쉑버거 신논현',
    date: '2023.10.18',
    menu: '쉑버거 싱글 세트',
    price: 14900,
    xp: 65,
    distance: '0.8km',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop',
    status: 'completed',
  },
]

/** 과거 주문 목록 (데모) */
const pastOrders: OrderItem[] = [
  {
    id: 4,
    storeId: resolveStoreIdFromFeatured('맥도날드 강남역점'),
    storeName: '맥도날드 강남역점',
    date: '2023.09.15',
    menu: '빅맥 세트',
    price: 8900,
    xp: 40,
    distance: '0.5km',
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=200&h=200&fit=crop',
    status: 'reviewed',
  },
  {
    id: 5,
    storeId: resolveStoreIdFromFeatured('서브웨이 역삼점'),
    storeName: '서브웨이 역삼점',
    date: '2023.09.10',
    menu: 'BLT 세트',
    price: 9500,
    xp: 45,
    distance: '1.0km',
    image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=200&h=200&fit=crop',
    status: 'reviewed',
  },
]

function OrderHistoryPage({ onBack: _onBack, onGoHome, onCartClick, onOrderStatusClick, onMapClick, onMypageClick, onFavoritesClick, onNotificationsClick, onReviewWriteClick, hasActiveOrder, cartCount = 0 }: OrderHistoryPageProps) {
  const [activeTab, setActiveTab] = useState<'recent' | 'past'>('recent')
  const [myOrdersApi, setMyOrdersApi] = useState<MyOrderItem[]>([])
  const [myOrdersLoading, setMyOrdersLoading] = useState(false)
  const [myOrdersError, setMyOrdersError] = useState<string | null>(null)
  const [localOrders, setLocalOrders] = useState<LocalOrder[]>([])

  const formatPrice = (price: number) => price.toLocaleString() + '원'

  useEffect(() => {
    setMyOrdersLoading(true)
    setMyOrdersError(null)
    void (async () => {
      try {
        const list = await getMyOrders()
        setMyOrdersApi(Array.isArray(list) ? list : [])
      } catch (e) {
        setMyOrdersError(
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : '주문 내역을 불러오지 못했습니다.',
        )
        setMyOrdersApi([])
      } finally {
        setMyOrdersLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('__jubjub_local_orders')
      const parsed = raw ? (JSON.parse(raw) as LocalOrder[]) : []
      setLocalOrders(Array.isArray(parsed) ? parsed : [])
    } catch {
      setLocalOrders([])
    }
  }, [])

  const apiOrders: OrderItem[] = useMemo(() => {
    const formatDate = (iso: string) => {
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return iso
      const yy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${yy}.${mm}.${dd}`
    }

    return myOrdersApi.map((o) => ({
      id: o.orderId,
      storeId: typeof o.storeId === 'number' ? o.storeId : resolveStoreIdFromFeatured(o.storeName),
      storeName: o.storeName,
      date: formatDate(o.orderedAt),
      menu: o.orderNo,
      price: o.finalAmount,
      xp: 0,
      distance: '',
      image:
        FEATURED_RESTAURANTS.find((r) => r.title === o.storeName)?.image ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop',
      status: 'completed',
    }))
  }, [myOrdersApi])

  const myOrders: OrderItem[] = useMemo(() => {
    const formatDate = (iso: string) => {
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return iso
      const yy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${yy}.${mm}.${dd}`
    }

    return localOrders.map((o) => {
      const img =
        o.image ||
        FEATURED_RESTAURANTS.find((r) => r.id === o.storeId)?.image ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop'
      const price = typeof o.finalAmount === 'number' ? o.finalAmount : o.totalAmount ?? 0
      const paid = o.paymentStatus === 'PAID'
      return {
        id: o.orderId,
        storeId: o.storeId,
        storeName: o.storeName,
        date: formatDate(o.createdAt),
        menu: o.menuSummary,
        price,
        xp: 0,
        distance: '',
        image: img,
        status: paid ? 'completed' : 'completed',
      }
    })
  }, [localOrders])

  const orders =
    activeTab === 'recent'
      ? apiOrders.length
        ? apiOrders
        : myOrders.length
          ? myOrders
          : recentOrders
      : pastOrders

  return (
    <Layout showBackground={false}>
      <div className={styles.root}>
        <Header
          title="주문 내역"
          onFavoriteClick={onFavoritesClick}
          onNotificationsClick={onNotificationsClick}
        />

        {/* 탭 */}
        <div className={styles.tabs}>
          <button
            onClick={() => setActiveTab('recent')}
            className={`${styles.tab} ${
              activeTab === 'recent' ? styles.tabActive : styles.tabInactive
            }`}
          >
            최근 주문
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`${styles.tab} ${
              activeTab === 'past' ? styles.tabActive : styles.tabInactive
            }`}
          >
            과거 주문
          </button>
        </div>

        {/* 스크롤 영역 */}
        <div className={styles.scrollArea}>
          {activeTab === 'recent' && (myOrdersLoading || myOrdersError) && (
            <div style={{ padding: '12px 16px' }}>
              {myOrdersLoading && (
                <p style={{ fontSize: 12, color: 'rgb(107 114 128)' }}>주문 내역을 불러오는 중…</p>
              )}
              {!myOrdersLoading && myOrdersError && (
                <p style={{ fontSize: 12, color: 'rgb(185 28 28)' }}>{myOrdersError}</p>
              )}
            </div>
          )}
          {/* 진행 중인 주문 */}
          {hasActiveOrder && (
            <div className={styles.activeOrderSection}>
              <p className={styles.activeOrderLabel}>
                <span className="material-symbols-outlined text-sm">pending</span>
                진행 중인 주문
              </p>
              <button
                onClick={onOrderStatusClick}
                className={styles.activeOrderButton}
              >
                <div className={styles.activeOrderIcon}>
                  <span className="material-symbols-outlined text-white text-2xl">skillet</span>
                </div>
                <div className={styles.activeOrderText}>
                  <div className={styles.activeOrderStatusRow}>
                    <span className={styles.activeOrderStatusBadge}>진행 중</span>
                  </div>
                  <p className={styles.activeOrderStoreName}>{FEATURED_RESTAURANTS[0].title}</p>
                  <p className={styles.activeOrderSubtitle}>주문 현황에서 단계를 확인하세요.</p>
                </div>
                <span className="material-symbols-outlined text-primary">chevron_right</span>
              </button>
            </div>
          )}

          <div className={styles.listWrapper}>
            {orders.map((order) => (
              <div
                key={order.id}
                className={styles.orderCard}
              >
                {/* 상단: 이미지 + 정보 */}
                <div className={styles.orderTopRow}>
                  {/* 이미지 */}
                  <img
                    src={order.image}
                    alt={order.storeName}
                    className={styles.orderImage}
                  />

                  {/* 정보 */}
                  <div className={styles.orderInfo}>
                    <div className={styles.orderTitleRow}>
                      <h3 className={styles.orderStoreName}>{order.storeName}</h3>
                      <span
                        className={`${styles.orderStatusBadge} ${
                          order.status === 'completed'
                            ? styles.orderStatusCompleted
                            : styles.orderStatusReviewed
                        }`}
                      >
                        {order.status === 'completed' ? '배달완료' : '리뷰완료'}
                      </span>
                    </div>
                    <p className={styles.orderMeta}>
                      <span>{order.date}</span>
                      <span>{order.menu}</span>
                    </p>
                    <div className={styles.orderStatsRow}>
                      <span className={styles.orderPrice}>{formatPrice(order.price)}</span>
                      <span className={styles.orderXp}>
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                        <span className="font-bold text-xs">{order.xp} XP</span>
                      </span>
                      <span className={styles.orderDistance}>
                        <span className="material-symbols-outlined text-sm">near_me</span>
                        <span className="text-xs">{order.distance}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 버튼 */}
                <div className={styles.orderActions}>
                  <button className={styles.reorderButton}>
                    다시 주문하기
                  </button>
                  {order.status === 'completed' && (
                    <button 
                      onClick={() =>
                        onReviewWriteClick?.({
                          storeName: order.storeName,
                          orderId: order.id,
                          storeId: order.storeId,
                        })
                      }
                      className={styles.reviewButton}
                    >
                      리뷰 작성하기
                    </button>
                  )}
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <div className={styles.emptyState}>
                <span className={`material-symbols-outlined ${styles.emptyStateIcon}`}>receipt_long</span>
                <p className={styles.emptyStateText}>주문 내역이 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* 하단 네비게이션 */}
        <BottomNav
          active="orders"
          cartCount={cartCount}
          onNavigate={(page) => {
            if (page === 'home') onGoHome()
            if (page === 'cart') onCartClick?.()
            if (page === 'map') onMapClick?.()
            if (page === 'mypage') onMypageClick?.()
          }}
        />
      </div>
    </Layout>
  )
}

export default OrderHistoryPage
