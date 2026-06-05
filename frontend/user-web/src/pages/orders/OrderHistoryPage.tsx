/**
 * OrderHistoryPage.tsx
 * 주문 내역 페이지 (탭: 주문내역)
 * - 최근 주문: 리뷰 미작성 / 지난 주문: 리뷰 작성 완료
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import {
  formatOrderMenuSummary,
  formatPickupDistance,
  getMyOrders,
  isPaidOrderForHistory,
  type MyOrderItem,
} from '../../api/orders'
import type { OrderStatus } from '../../api/payment'
import { fetchMyReviews, type ReviewWritePayload } from '../../api/reviews'
import { fetchStores } from '../../api/store'
import { ApiError } from '../../api/authClient'
import { getAccessToken, getCachedMemberProfileId } from '../../lib/authStorage'
import { useProfile } from '../../hooks/useProfile'
import type { PickupDestination } from '../../hooks/useActivePickup'
import {
  readLocalOrdersPendingApiSync,
  syncLocalOrdersWithApiList,
  type OrderContextRow,
} from '../../lib/orderResolve'
import { storeCardImage } from '../../lib/storeGeo'
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
  activeOrder?: OrderContextRow | null
  pickupDestination?: PickupDestination | null
  cartCount?: number
}

interface OrderItem {
  id: number
  storeId: number
  storeName: string
  date: string
  menu: string
  price: number
  distance: string
  image: string
  status: 'completed' | 'reviewed'
  orderStatus?: OrderStatus
}

/** 동일 orderId가 API·로컬에 중복될 때 React key 충돌 방지 — 먼저 나온 행만 유지 */
function dedupeOrdersById(items: OrderItem[]): OrderItem[] {
  const seen = new Set<number>()
  const out: OrderItem[] = []
  for (const o of items) {
    if (seen.has(o.id)) continue
    seen.add(o.id)
    out.push(o)
  }
  return out
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
  orderStatus?: string
  paymentStatus?: string
  paidAt?: string | null
}

function readPaidLocalOrders(): LocalOrder[] {
  try {
    const raw = window.localStorage.getItem('__jubjub_local_orders')
    const parsed = raw ? (JSON.parse(raw) as LocalOrder[]) : []
    const paidOnly = Array.isArray(parsed) ? parsed.filter(isLocalOrderPaid) : []
    if (Array.isArray(parsed) && paidOnly.length !== parsed.length) {
      window.localStorage.setItem('__jubjub_local_orders', JSON.stringify(paidOnly))
    }
    return paidOnly
  } catch {
    return []
  }
}

/**
 * 서버 주문 내역에 storeId가 없을 때 리뷰 작성용 storeId 보강
 * 1) 응답에 storeId가 있으면 사용
 * 2) 결제 시 저장한 `__jubjub_local_orders` 행과 orderId로 매칭
 * 3) GET /api/v1/stores 목록에서 매장명 정확 일치
 */
function resolveStoreIdForServerOrder(
  o: MyOrderItem,
  localOrders: LocalOrder[],
  storeNameToId: Record<string, number>,
): number {
  if (typeof o.storeId === 'number' && !Number.isNaN(o.storeId)) {
    return o.storeId
  }
  const local = localOrders.find((lo) => lo.orderId === o.orderId)
  if (local != null && typeof local.storeId === 'number' && !Number.isNaN(local.storeId)) {
    return local.storeId
  }
  const key = o.storeName?.trim()
  if (key && storeNameToId[key] != null) {
    return storeNameToId[key]
  }
  return 0
}

function applyReviewedStatus(orders: OrderItem[], reviewedOrderIds: Set<number>): OrderItem[] {
  return orders.map((o) =>
    reviewedOrderIds.has(o.id) ? { ...o, status: 'reviewed' as const } : o,
  )
}

function isLocalOrderPaid(o: LocalOrder): boolean {
  if (o.paymentStatus === 'PAID') return true
  if (o.orderStatus === 'PAID' || o.orderStatus === 'COMPLETED') return true
  if (o.paidAt != null && String(o.paidAt).trim() !== '') return true
  return false
}

function parseOrderDisplayDate(date: string): number {
  const parts = date.split('.')
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime()
  }
  return 0
}

function sortOrdersByDateDesc(items: OrderItem[]): OrderItem[] {
  return [...items].sort((a, b) => parseOrderDisplayDate(b.date) - parseOrderDisplayDate(a.date))
}

function OrderHistoryPage({
  onBack: _onBack,
  onGoHome,
  onCartClick,
  onOrderStatusClick,
  onMapClick,
  onMypageClick,
  onFavoritesClick,
  onNotificationsClick,
  onReviewWriteClick,
  hasActiveOrder,
  activeOrder,
  pickupDestination,
  cartCount = 0,
}: OrderHistoryPageProps) {
  const { profile } = useProfile()
  const [activeTab, setActiveTab] = useState<'recent' | 'past'>('recent')
  const [myOrdersApi, setMyOrdersApi] = useState<MyOrderItem[]>([])
  const [myOrdersLoading, setMyOrdersLoading] = useState(false)
  const [myOrdersError, setMyOrdersError] = useState<string | null>(null)
  const [localOrders, setLocalOrders] = useState<LocalOrder[]>([])
  const [storeNameToId, setStoreNameToId] = useState<Record<string, number>>({})
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<number>>(() => new Set())

  const formatPrice = (price: number) => price.toLocaleString() + '원'

  const activeOrderTitle =
    activeOrder?.storeName?.trim() || pickupDestination?.name?.trim() || '진행 중인 주문'
  const activeOrderSubtitle =
    activeOrder?.menuSummary?.trim() || '주문 현황에서 단계를 확인하세요.'

  const reloadMyOrdersApi = useCallback(() => {
    if (!getAccessToken()) {
      setMyOrdersApi([])
      setMyOrdersLoading(false)
      setMyOrdersError(null)
      return
    }
    setMyOrdersLoading(true)
    setMyOrdersError(null)
    void (async () => {
      try {
        const list = await getMyOrders()
        const paidOnly = Array.isArray(list) ? list.filter(isPaidOrderForHistory) : []
        syncLocalOrdersWithApiList(paidOnly)
        setMyOrdersApi(paidOnly)
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
    reloadMyOrdersApi()
  }, [reloadMyOrdersApi])

  const reloadLocalOrders = useCallback(() => {
    setLocalOrders(readPaidLocalOrders())
  }, [])

  useEffect(() => {
    reloadLocalOrders()
  }, [reloadLocalOrders])

  useEffect(() => {
    const onOrdersUpdated = () => {
      reloadLocalOrders()
      reloadMyOrdersApi()
    }
    window.addEventListener('focus', onOrdersUpdated)
    window.addEventListener('jubjub:orders-updated', onOrdersUpdated)
    return () => {
      window.removeEventListener('focus', onOrdersUpdated)
      window.removeEventListener('jubjub:orders-updated', onOrdersUpdated)
    }
  }, [reloadLocalOrders, reloadMyOrdersApi])

  useEffect(() => {
    const loadReviewedOrderIds = () => {
      if (!getAccessToken()) {
        setReviewedOrderIds(new Set())
        return
      }
      const mpid = profile?.memberProfileId ?? getCachedMemberProfileId()
      if (mpid == null) {
        setReviewedOrderIds(new Set())
        return
      }
      void fetchMyReviews(Number(mpid))
        .then((list) => setReviewedOrderIds(new Set(list.map((r) => r.orderId))))
        .catch(() => setReviewedOrderIds(new Set()))
    }
    loadReviewedOrderIds()
    window.addEventListener('focus', loadReviewedOrderIds)
    return () => window.removeEventListener('focus', loadReviewedOrderIds)
  }, [profile?.memberProfileId])

  useEffect(() => {
    void (async () => {
      try {
        const list = await fetchStores()
        const m: Record<string, number> = {}
        for (const s of list) {
          const n = s.name?.trim()
          if (n && m[n] === undefined) m[n] = s.storeId
        }
        setStoreNameToId(m)
      } catch {
        /* 매장 목록 실패 시에도 주문 목록은 표시 */
      }
    })()
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

    return dedupeOrdersById(
      myOrdersApi.map((o) => {
        const storeId = resolveStoreIdForServerOrder(o, localOrders, storeNameToId)
        return {
          id: o.orderId,
          storeId,
          storeName: o.storeName,
          date: formatDate(o.orderedAt),
          menu: formatOrderMenuSummary(o),
          price: o.finalAmount,
          distance: formatPickupDistance(o.pickupDistanceMeters),
          image: storeId > 0 ? storeCardImage(storeId) : storeCardImage(1),
          status: 'completed' as const,
          orderStatus: o.orderStatus,
        }
      }),
    )
  }, [myOrdersApi, localOrders, storeNameToId])

  const pendingLocalOrders: OrderItem[] = useMemo(() => {
    if (!getAccessToken()) return []
    const formatDate = (iso: string) => {
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return iso
      const yy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${yy}.${mm}.${dd}`
    }
    const apiIds = new Set(myOrdersApi.map((o) => o.orderId))
    return dedupeOrdersById(
      readLocalOrdersPendingApiSync(apiIds).map((o) => {
        const price = typeof o.finalAmount === 'number' ? o.finalAmount : o.totalAmount ?? 0
        return {
          id: o.orderId,
          storeId: o.storeId,
          storeName: o.storeName,
          date: formatDate(o.createdAt ?? ''),
          menu: o.menuSummary ?? '주문',
          price,
          distance: '',
          image: storeCardImage(o.storeId),
          status: 'completed' as const,
        }
      }),
    )
  }, [myOrdersApi])

  const allOrders = useMemo(() => {
    const base = dedupeOrdersById([...apiOrders, ...pendingLocalOrders])
    return applyReviewedStatus(base, reviewedOrderIds)
  }, [apiOrders, pendingLocalOrders, reviewedOrderIds])

  /** 최근 주문 — 리뷰를 아직 쓰지 않은 주문 */
  const recentTabOrders = useMemo(
    () => sortOrdersByDateDesc(allOrders.filter((o) => o.status !== 'reviewed')),
    [allOrders],
  )

  /** 지난 주문 — 리뷰 작성이 완료된 주문 */
  const pastTabOrders = useMemo(
    () => sortOrdersByDateDesc(allOrders.filter((o) => o.status === 'reviewed')),
    [allOrders],
  )

  const orders = activeTab === 'recent' ? recentTabOrders : pastTabOrders

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
            지난 주문
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
                  <p className={styles.activeOrderStoreName}>{activeOrderTitle}</p>
                  <p className={styles.activeOrderSubtitle}>{activeOrderSubtitle}</p>
                </div>
                <span className="material-symbols-outlined text-primary">chevron_right</span>
              </button>
            </div>
          )}

          <div className={styles.listWrapper}>
            {orders.length === 0 && !myOrdersLoading && (
              <div className={styles.emptyState}>
                <span
                  className={`material-symbols-outlined ${styles.emptyStateIcon}`}
                  aria-hidden
                >
                  {activeTab === 'recent' ? 'rate_review' : 'check_circle'}
                </span>
                <p className={styles.emptyStateTitle}>
                  {activeTab === 'recent'
                    ? '리뷰를 남길 주문이 없어요'
                    : '작성한 리뷰 주문이 없어요'}
                </p>
                <p className={styles.emptyStateText}>
                  {activeTab === 'recent'
                    ? '픽업을 완료하면 이곳에서 리뷰를 작성할 수 있어요.'
                    : '리뷰를 남기면 이 탭에서 확인할 수 있어요.'}
                </p>
              </div>
            )}
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
                      <span className={styles.orderDistance}>
                        <span className="material-symbols-outlined text-sm">near_me</span>
                        <span className="text-xs">{order.distance}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.orderActions}>
                  <button type="button" className={styles.reorderButton}>
                    다시 주문하기
                  </button>
                  {order.status === 'completed' && order.storeId > 0 && (
                    <button
                      type="button"
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
          </div>
        </div>

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
