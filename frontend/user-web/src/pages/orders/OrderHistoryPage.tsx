/**
 * OrderHistoryPage.tsx
 * 주문 내역 페이지 (탭: 주문내역)
 * - 최근 주문: 픽업완료·리뷰 미작성 / 지난 주문: 리뷰완료·거절
 * - 진행 중(PAID)은 상단 trackable 카드만 (내역 목록에는 넣지 않음)
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
import type { TrackablePickup } from '../../hooks/useActivePickup'
import {
  readLocalOrdersPendingApiSync,
  syncLocalOrdersWithApiList,
} from '../../lib/orderResolve'
import { formatPickupHhMm } from '../../lib/pickupEta'
import { storeCardImage } from '../../lib/storeGeo'
import styles from './OrderHistoryPage.module.css'

interface OrderHistoryPageProps {
  onBack?: () => void
  onGoHome: () => void
  onCartClick?: () => void
  onOrderStatusClick?: (orderId?: number) => void
  onMapClick?: () => void
  onMypageClick?: () => void
  onFavoritesClick?: () => void
  onNotificationsClick?: () => void
  /** 리뷰 쓰기 클릭 시 주문·매장 정보 전달 후 리뷰 작성 페이지로 이동 */
  onReviewWriteClick?: (payload: ReviewWritePayload) => void
  /** 결제 완료·픽업 전인 주문 전부 */
  trackableOrders?: TrackablePickup[]
  cartCount?: number
}

interface OrderItem {
  id: number
  storeId: number
  storeName: string
  /** 서버 orderNo (없으면 orderId로 표시) */
  orderNo: string
  date: string
  menu: string
  price: number
  distance: string
  image: string
  status: 'completed' | 'reviewed' | 'rejected'
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
  return orders.map((o) => {
    if (o.status === 'rejected') return o
    return reviewedOrderIds.has(o.id) ? { ...o, status: 'reviewed' as const } : o
  })
}

function isLocalOrderPaid(o: LocalOrder): boolean {
  if (o.paymentStatus === 'PAID') return true
  if (o.orderStatus === 'PAID' || o.orderStatus === 'COMPLETED') return true
  if (o.paidAt != null && String(o.paidAt).trim() !== '') return true
  return false
}

function historyStatusFromOrder(orderStatus?: string | null): OrderItem['status'] | null {
  if (orderStatus === 'REFUNDED') return 'rejected'
  if (orderStatus === 'COMPLETED') return 'completed'
  // PAID·그 외 진행 중은 주문 내역 목록에 넣지 않음 (픽업 완료만)
  return null
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
  trackableOrders = [],
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
    window.addEventListener('jubjub:reviews-updated', loadReviewedOrderIds)
    return () => {
      window.removeEventListener('focus', loadReviewedOrderIds)
      window.removeEventListener('jubjub:reviews-updated', loadReviewedOrderIds)
    }
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
      myOrdersApi
        .filter((o) => isPaidOrderForHistory(o))
        .map((o) => {
          const status = historyStatusFromOrder(o.orderStatus)
          if (status == null) return null
          const storeId = resolveStoreIdForServerOrder(o, localOrders, storeNameToId)
          return {
            id: o.orderId,
            storeId,
            storeName: o.storeName,
            orderNo: (o.orderNo && String(o.orderNo).trim()) || String(o.orderId),
            date: formatDate(o.orderedAt),
            menu: formatOrderMenuSummary(o),
            price: o.finalAmount,
            distance: formatPickupDistance(o.pickupDistanceMeters),
            image: storeId > 0 ? storeCardImage(storeId) : storeCardImage(1),
            status,
            orderStatus: o.orderStatus,
          }
        })
        .filter((o): o is OrderItem => o != null),
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
      readLocalOrdersPendingApiSync(apiIds)
        .map((o) => {
          const price = typeof o.finalAmount === 'number' ? o.finalAmount : o.totalAmount ?? 0
          // 로컬 동기화 대기 건도 픽업 완료·거절만 내역에 노출
          const status: OrderItem['status'] | null =
            o.orderStatus === 'REFUNDED'
              ? 'rejected'
              : o.pickupCompleted || o.orderStatus === 'COMPLETED'
                ? 'completed'
                : null
          if (status == null) return null
          return {
            id: o.orderId,
            storeId: o.storeId,
            storeName: o.storeName,
            orderNo: String(o.orderId),
            date: formatDate(o.createdAt ?? ''),
            menu: o.menuSummary ?? '주문',
            price,
            distance: '',
            image: storeCardImage(o.storeId),
            status,
            orderStatus: o.orderStatus as OrderStatus | undefined,
          }
        })
        .filter((o): o is OrderItem => o != null),
    )
  }, [myOrdersApi])

  const allOrders = useMemo(() => {
    const base = dedupeOrdersById([...apiOrders, ...pendingLocalOrders])
    return applyReviewedStatus(base, reviewedOrderIds)
  }, [apiOrders, pendingLocalOrders, reviewedOrderIds])

  /** 최근 주문 — 픽업 완료·리뷰 미작성만 */
  const recentTabOrders = useMemo(
    () => sortOrdersByDateDesc(allOrders.filter((o) => o.status === 'completed')),
    [allOrders],
  )

  /** 지난 주문 — 리뷰 완료 또는 거절·환불 */
  const pastTabOrders = useMemo(
    () =>
      sortOrdersByDateDesc(
        allOrders.filter((o) => o.status === 'reviewed' || o.status === 'rejected'),
      ),
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
          {/* 진행·대기 주문 — 결제한 건수만큼 표시 */}
          {trackableOrders.length > 0 && (
            <div className={styles.activeOrderSection}>
              <p className={styles.activeOrderLabel}>
                <span className="material-symbols-outlined text-sm">pending</span>
                진행 중인 주문{trackableOrders.length > 1 ? ` ${trackableOrders.length}건` : ''}
              </p>
              <div className={styles.activeOrderList}>
                {trackableOrders.map((item) => {
                  const waiting = item.phase === 'waiting'
                  const hhmm = formatPickupHhMm(item.estimatedPickupTime)
                  const title = item.order.storeName?.trim() || '진행 중인 주문'
                  const subtitle = waiting
                    ? hhmm
                      ? `픽업 ${hhmm} 예정 · 매장 수락을 기다리고 있어요.`
                      : item.order.menuSummary?.trim() || '매장에서 주문을 확인하면 조리가 시작돼요.'
                    : hhmm
                      ? `픽업 ${hhmm} 예정 · ${item.order.menuSummary?.trim() || '주문 현황에서 단계를 확인하세요.'}`
                      : item.order.menuSummary?.trim() || '주문 현황에서 단계를 확인하세요.'
                  return (
                    <button
                      key={item.order.orderId}
                      type="button"
                      onClick={() => onOrderStatusClick?.(item.order.orderId)}
                      className={styles.activeOrderButton}
                    >
                      <div className={styles.activeOrderIcon}>
                        <span className="material-symbols-outlined text-white text-2xl">
                          {waiting ? 'receipt_long' : 'skillet'}
                        </span>
                      </div>
                      <div className={styles.activeOrderText}>
                        <div className={styles.activeOrderStatusRow}>
                          <span className={styles.activeOrderStatusBadge}>
                            {waiting ? '수락 대기' : '진행 중'}
                          </span>
                          <span className={styles.activeOrderStatusTime}>#{item.order.orderId}</span>
                        </div>
                        <p className={styles.activeOrderStoreName}>{title}</p>
                        <p className={styles.activeOrderSubtitle}>{subtitle}</p>
                      </div>
                      <span className="material-symbols-outlined text-primary">chevron_right</span>
                    </button>
                  )
                })}
              </div>
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
                          order.status === 'rejected'
                            ? styles.orderStatusRejected
                            : order.status === 'completed'
                              ? styles.orderStatusCompleted
                              : styles.orderStatusReviewed
                        }`}
                      >
                        {order.status === 'rejected'
                          ? '주문거절'
                          : order.status === 'completed'
                            ? '픽업완료'
                            : '리뷰완료'}
                      </span>
                    </div>
                    <p className={styles.orderNo}>주문번호 #{order.orderNo}</p>
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
