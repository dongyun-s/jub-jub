/**
 * OrderStatusPage.tsx
 * 주문 현황 페이지 (결제 후 또는 주문내역/홈 배너에서 진입)
 * - 픽업 매장 지도, 주문접수→조리중→픽업준비→픽업완료 단계 표시
 * - 픽업 완료 시 POST /api/v1/orders/{orderId}/complete → 리워드(orderCount) 반영
 */

import { useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout'
import BottomNav from '../../components/BottomNav'
import PickupRewardModal from '../../components/PickupRewardModal/PickupRewardModal'
import { FEATURED_RESTAURANTS } from '../../constants'
import type { ReviewWritePayload } from '../../api/reviews'
import { completeOrderPickup, getMyOrders } from '../../api/orders'
import { ApiError } from '../../api/authClient'
import { getAccessToken } from '../../lib/authStorage'
import { resolveUserCoords } from '../../lib/geolocation'
import { notifyRewardsUpdated } from '../../api/rewards'
import { MapTmapCanvas } from '../map/MapPage'
import styles from './OrderStatusPage.module.css'

interface OrderStatusPageProps {
  onBack: () => void
  onGoHome?: () => void
  onCartClick?: () => void
  onOrdersClick?: () => void
  onMapClick?: () => void
  onMypageClick?: () => void
  onFavoritesClick?: () => void
  onNotificationsClick?: () => void
  onReviewWriteClick?: (payload: ReviewWritePayload) => void
  onPickupComplete?: () => void
  cartCount?: number
}

type OrderStep = 'received' | 'cooking' | 'ready' | 'completed'

/** 조리중 → 픽업준비(조리 완료) 자동 전환 대기 시간 (ms) */
const COOKING_TO_READY_MS = 15_000

const LOCAL_ORDERS_KEY = '__jubjub_local_orders'

type LocalOrderRow = {
  orderId: number
  storeId: number
  storeName: string
  menuSummary?: string
  /** 명세: READY | PAID | COMPLETED */
  orderStatus?: string
  paymentStatus?: string
  pickupCompleted?: boolean
  createdAt?: string
}

/** 픽업 대기 중인 주문 — orderStatus PAID(명세) 또는 로컬 paymentStatus PAID */
function isPickupPending(o: LocalOrderRow): boolean {
  if (o.pickupCompleted || o.orderStatus === 'COMPLETED') return false
  if (o.orderStatus === 'PAID') return true
  return o.paymentStatus === 'PAID'
}

const fallbackOrder = {
  orderNumber: '—',
  pickupTime: '—',
  menuName: '주문 정보 없음',
  storeId: FEATURED_RESTAURANTS[0].id,
  storeName: FEATURED_RESTAURANTS[0].title,
  storeAddress: '서울 강남구 테헤란로 123 (데모)',
  distance: '지도·경로 탭',
  estimatedTime: '에서 확인',
}

function readLocalOrders(): LocalOrderRow[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_ORDERS_KEY)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(arr) ? (arr as LocalOrderRow[]) : []
  } catch {
    return []
  }
}

function getActivePaidOrderFromLocal(): LocalOrderRow | null {
  const paid = readLocalOrders().filter((o) => o?.orderId && isPickupPending(o))
  return paid[0] ?? null
}

async function resolveActivePaidOrder(): Promise<LocalOrderRow | null> {
  const local = getActivePaidOrderFromLocal()
  if (local) return local
  if (!getAccessToken()) return null
  try {
    const list = await getMyOrders()
    const paid = Array.isArray(list) ? list.find((o) => o.orderStatus === 'PAID') : undefined
    if (!paid) return null
    const localMatch = readLocalOrders().find((lo) => lo.orderId === paid.orderId)
    return {
      orderId: paid.orderId,
      storeId: paid.storeId ?? localMatch?.storeId ?? FEATURED_RESTAURANTS[0].id,
      storeName: paid.storeName,
      menuSummary: localMatch?.menuSummary ?? paid.orderNo,
      orderStatus: 'PAID',
      paymentStatus: paid.paymentStatus ?? 'PAID',
      createdAt: localMatch?.createdAt ?? paid.orderedAt,
    }
  } catch {
    return null
  }
}

function markLocalOrderPickupCompleted(orderId: number) {
  try {
    const prev = readLocalOrders()
    const next = prev.map((o) =>
      o.orderId === orderId
        ? { ...o, pickupCompleted: true, orderStatus: 'COMPLETED' }
        : o,
    )
    window.localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}

function formatOrderNumber(orderId: number) {
  return String(orderId)
}

function formatPickupTime(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const steps: { key: OrderStep; label: string; icon: string }[] = [
  { key: 'received', label: '주문접수', icon: 'check_circle' },
  { key: 'cooking', label: '조리중', icon: 'skillet' },
  { key: 'ready', label: '픽업준비', icon: 'inventory_2' },
  { key: 'completed', label: '픽업완료', icon: 'celebration' },
]

function OrderStatusPage({
  onBack,
  onGoHome,
  onCartClick,
  onOrdersClick,
  onMapClick,
  onMypageClick,
  onFavoritesClick: _onFavoritesClick,
  onNotificationsClick: _onNotificationsClick,
  onReviewWriteClick,
  onPickupComplete,
  cartCount = 0,
}: OrderStatusPageProps) {
  const [activeOrder, setActiveOrder] = useState<LocalOrderRow | null>(null)
  const [orderResolving, setOrderResolving] = useState(true)
  const [orderStep, setOrderStep] = useState<OrderStep>('cooking')
  const [rewardModalOpen, setRewardModalOpen] = useState(false)
  const [pickupSubmitting, setPickupSubmitting] = useState(false)
  const [pickupError, setPickupError] = useState<string | null>(null)
  const [cookingSecondsLeft, setCookingSecondsLeft] = useState(
    Math.ceil(COOKING_TO_READY_MS / 1000),
  )

  useEffect(() => {
    let cancelled = false
    setOrderResolving(true)
    void resolveActivePaidOrder().then((order) => {
      if (!cancelled) {
        setActiveOrder(order)
        setOrderResolving(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const display = useMemo(() => {
    if (!activeOrder) return fallbackOrder
    return {
      orderNumber: formatOrderNumber(activeOrder.orderId),
      pickupTime: formatPickupTime(activeOrder.createdAt),
      menuName: activeOrder.menuSummary?.trim() || '주문',
      storeId: activeOrder.storeId,
      storeName: activeOrder.storeName,
      storeAddress: fallbackOrder.storeAddress,
      distance: fallbackOrder.distance,
      estimatedTime: fallbackOrder.estimatedTime,
    }
  }, [activeOrder])

  const reviewPayload = useMemo((): ReviewWritePayload => {
    if (activeOrder) {
      return {
        orderId: activeOrder.orderId,
        storeId: activeOrder.storeId,
        storeName: activeOrder.storeName,
      }
    }
    return {
      orderId: 0,
      storeId: display.storeId,
      storeName: display.storeName,
    }
  }, [activeOrder, display.storeId, display.storeName])

  useEffect(() => {
    if (orderStep !== 'cooking') return
    setCookingSecondsLeft(Math.ceil(COOKING_TO_READY_MS / 1000))
    const intervalId = window.setInterval(() => {
      setCookingSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId)
          setOrderStep('ready')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(intervalId)
  }, [orderStep])

  const currentStepIndex = steps.findIndex((s) => s.key === orderStep)

  const pickupStore =
    FEATURED_RESTAURANTS.find((r) => r.id === display.storeId) ?? FEATURED_RESTAURANTS[0]
  const storeMapLat = pickupStore.lat
  const storeMapLng = pickupStore.lng

  const completePickup = () => {
    const order = activeOrder ?? getActivePaidOrderFromLocal()
    if (!order?.orderId) {
      setPickupError('픽업할 주문을 찾을 수 없습니다. 결제 완료 후 다시 시도해 주세요.')
      return
    }

    setPickupSubmitting(true)
    setPickupError(null)

    const storeFallback =
      storeMapLat != null && storeMapLng != null
        ? { latitude: storeMapLat, longitude: storeMapLng }
        : null

    void resolveUserCoords(storeFallback)
      .then((coords) =>
        completeOrderPickup(order.orderId, {
          userLatitude: coords.latitude,
          userLongitude: coords.longitude,
        }),
      )
      .then(() => {
        markLocalOrderPickupCompleted(order.orderId)
        setActiveOrder(null)
        setOrderStep('completed')
        setRewardModalOpen(true)
        notifyRewardsUpdated()
        onPickupComplete?.()
      })
      .catch((e) => {
        if (e instanceof Error && e.message === 'GEO_DENIED') {
          setPickupError('위치 권한을 허용해 주세요. 픽업 완료에는 현재 위치가 필요합니다.')
          return
        }
        if (e instanceof Error && e.message === 'GEO_UNAVAILABLE') {
          setPickupError('이 기기에서는 위치 정보를 사용할 수 없습니다.')
          return
        }
        if (e instanceof ApiError && e.status === 403) {
          setPickupError(
            '접근이 거부되었습니다(403). 로그아웃 후 다시 로그인해 주세요.',
          )
          return
        }
        if (e instanceof ApiError && e.status === 401) {
          setPickupError('로그인이 만료되었습니다. 다시 로그인한 뒤 시도해 주세요.')
          return
        }
        setPickupError(
          e instanceof ApiError ? e.message : '픽업 완료 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        )
      })
      .finally(() => setPickupSubmitting(false))
  }

  const handleRewardClose = () => {
    setRewardModalOpen(false)
  }

  const handleReviewFromModal = () => {
    setRewardModalOpen(false)
    onReviewWriteClick?.(reviewPayload)
  }

  const getStepStatus = (index: number) => {
    if (index < currentStepIndex) return 'completed'
    if (index === currentStepIndex) return 'active'
    return 'pending'
  }

  return (
    <Layout showBackground={false}>
      <div className={styles.root}>
        <header className={styles.header}>
          <button type="button" onClick={() => onBack()} className={styles.backButton}>
            <span className={`material-symbols-outlined ${styles.backIcon}`}>arrow_back</span>
          </button>
          <h1 className={styles.headerTitle}>주문 현황 및 경로</h1>
          <div className={styles.headerSpacer} />
        </header>

        <div className={styles.scrollArea}>
          <div className={styles.mapWrap}>
            {storeMapLat != null && storeMapLng != null ? (
              <MapTmapCanvas
                className={styles.mapIframe}
                center={{ lat: storeMapLat, lng: storeMapLng }}
                zoom={17}
                markers={[{ lat: storeMapLat, lng: storeMapLng, title: display.storeName }]}
                fitMarkers={false}
              />
            ) : (
              <div
                className={styles.mapIframe}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgb(243 244 246)',
                  color: 'rgb(107 114 128)',
                  fontSize: '0.875rem',
                }}
              >
                매장 좌표가 없습니다.
              </div>
            )}
            <div className={styles.distanceCard}>
              <div className={styles.distanceCardInner}>
                <div className={styles.distanceIconWrap}>
                  <span className={`material-symbols-outlined ${styles.distanceIcon}`}>directions_walk</span>
                </div>
                <div>
                  <p className={styles.distanceLabel}>남은 거리</p>
                  <p className={styles.distanceValue}>
                    {display.distance}{' '}
                    <span className={styles.distanceTime}>({display.estimatedTime})</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.orderSection}>
            <div className={styles.orderRow}>
              <p className={styles.orderNumber}>주문 번호: {display.orderNumber}</p>
              <span className={styles.pickupBadge}>
                {orderStep === 'completed' ? '픽업 완료' : `픽업 ${display.pickupTime} 예정`}
              </span>
            </div>
            <h2 className={styles.orderTitle}>{display.menuName}</h2>
            {!orderResolving && !activeOrder && orderStep !== 'completed' && (
              <p className={styles.pickupDoneHint} style={{ color: 'rgb(107 114 128)', marginTop: '0.5rem' }}>
                결제 완료(PAID) 주문이 없습니다. 장바구니에서 결제 후 다시 시도해 주세요.
              </p>
            )}
          </div>

          <div className={styles.stepsSection}>
            <div className={styles.stepsRow}>
              {steps.map((step, index) => {
                const status = getStepStatus(index)
                return (
                  <div key={step.key} className={styles.stepItem}>
                    <div
                      className={`${styles.stepIcon} ${
                        status === 'completed'
                          ? styles.stepIconCompleted
                          : status === 'active'
                            ? styles.stepIconActive
                            : styles.stepIconPending
                      }`}
                    >
                      <span className={`material-symbols-outlined ${styles.stepIconSpan}`}>
                        {status === 'completed' ? 'check' : step.icon}
                      </span>
                    </div>
                    <p
                      className={`${styles.stepLabel} ${
                        status === 'active'
                          ? styles.stepLabelActive
                          : status === 'completed'
                            ? styles.stepLabelCompleted
                            : styles.stepLabelPending
                      }`}
                    >
                      {step.label}
                    </p>
                    {index < steps.length - 1 && (
                      <div
                        className={`${styles.stepConnector} ${status === 'completed' ? styles.stepConnectorDone : styles.stepConnectorPending}`}
                        style={{
                          left: `calc(${(index + 0.5) * 25}% + 24px)`,
                          top: '24px',
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
            {orderStep === 'cooking' && (
              <div className={styles.cookingWaitBox}>
                <div className={styles.cookingWaitIcon}>
                  <span className={`material-symbols-outlined ${styles.cookingWaitIconSpan}`}>skillet</span>
                </div>
                <p className={styles.cookingWaitTitle}>조리 중이에요</p>
                <p className={styles.cookingWaitDesc}>조리가 끝나면 픽업완료 버튼을 눌러주세요.</p>
                <p className={styles.cookingCountdown}>
                  <span className="material-symbols-outlined">timer</span>
                  픽업 준비까지 약 <strong>{cookingSecondsLeft}</strong>초
                </p>
              </div>
            )}
            {orderStep === 'ready' && (
              <div className={styles.pickupDoneWrap}>
                <button
                  type="button"
                  className={styles.pickupDoneButton}
                  onClick={completePickup}
                  disabled={pickupSubmitting || orderResolving || !activeOrder}
                >
                  <span className="material-symbols-outlined">verified</span>
                  {pickupSubmitting ? '처리 중…' : '매장에서 픽업을 완료했어요'}
                </button>
                <p className={styles.pickupDoneHint}>
                  버튼을 누르면 픽업 횟수가 반영되고 리워드를 받을 수 있어요.
                </p>
                {pickupError && (
                  <p className={styles.pickupDoneHint} style={{ color: 'rgb(220 38 38)' }}>
                    {pickupError}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className={styles.storeSection}>
            <div className={styles.storeCard}>
              <div className={styles.storeCardHeader}>
                <div className={styles.storeCardIcon}>
                  <span className={`material-symbols-outlined ${styles.storeCardIconSpan}`}>storefront</span>
                </div>
                <div>
                  <h3 className={styles.storeCardName}>{display.storeName}</h3>
                  <p className={styles.storeCardAddress}>
                    <span className={`material-symbols-outlined ${styles.storeCardAddressIcon}`}>location_on</span>
                    {display.storeAddress}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => onMapClick?.()} className={styles.navButton}>
                <span className="material-symbols-outlined">directions</span>
                길찾기 보러가기
              </button>
            </div>
          </div>
        </div>

        <BottomNav
          active="orders"
          cartCount={cartCount}
          onNavigate={(page) => {
            if (page === 'home') onGoHome?.()
            if (page === 'orders') onOrdersClick?.()
            if (page === 'cart') onCartClick?.()
            if (page === 'map') onMapClick?.()
            if (page === 'mypage') onMypageClick?.()
          }}
        />

        <PickupRewardModal
          open={rewardModalOpen}
          onClose={handleRewardClose}
          storeName={display.storeName}
          onWriteReview={onReviewWriteClick ? handleReviewFromModal : undefined}
        />
      </div>
    </Layout>
  )
}

export default OrderStatusPage
