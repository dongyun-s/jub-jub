/**
 * OrderStatusPage.tsx
 * 주문 현황 페이지 (결제 후 또는 주문내역/홈 배너에서 진입)
 * - 픽업 매장 지도, 주문접수→조리중→픽업준비→픽업완료 단계 표시
 * - 픽업 완료는 사장님 POS에서 처리 · 고객은 상태만 확인
 */

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import Layout from '../../components/Layout'
import BottomNav from '../../components/BottomNav'
import type { ReviewWritePayload } from '../../api/reviews'
import type { PickupDestination } from '../../hooks/useActivePickup'
import type { OrderContextRow } from '../../lib/orderResolve'
import {
  fetchOrderTracking,
  mapTrackingToOrderStep,
  type OrderStep,
} from '../../api/orderTracking'
import { getAccessToken } from '../../lib/authStorage'
import { useDistanceToCoords } from '../../hooks/useDistanceToCoords'
import { LocationPermissionBanner } from '../../components/LocationPermissionBanner/LocationPermissionBanner'
import { MapTmapCanvas } from '../map/MapPage'
import type { MapTmapMarker } from '../../lib/mapCategoryMarkers'
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
  activeOrder?: OrderContextRow | null
  pickupDestination?: PickupDestination | null
  pickupContextLoading?: boolean
  cartCount?: number
}

const TRACKING_POLL_MS = 10_000

const LOCAL_ORDERS_KEY = '__jubjub_local_orders'

const emptyDisplay = {
  orderNumber: '—',
  pickupTime: '—',
  menuName: '주문 정보 없음',
  storeId: 0,
  storeName: '—',
  storeAddress: '—',
  distance: '',
  estimatedTime: '',
}

function readLocalOrders(): OrderContextRow[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_ORDERS_KEY)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(arr) ? (arr as OrderContextRow[]) : []
  } catch {
    return []
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
    window.dispatchEvent(new Event('jubjub:orders-updated'))
  } catch {
    /* ignore */
  }
}

function markLocalOrderRejected(orderId: number) {
  try {
    const prev = readLocalOrders()
    const next = prev.map((o) =>
      o.orderId === orderId
        ? { ...o, pickupCompleted: true, orderStatus: 'REFUNDED' }
        : o,
    )
    window.localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(next))
    window.dispatchEvent(new Event('jubjub:orders-updated'))
  } catch {
    /* ignore */
  }
}

function formatOrderNumber(orderId: number) {
  return String(orderId)
}

function formatPickupTime(iso?: string | null) {
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
  activeOrder = null,
  pickupDestination = null,
  pickupContextLoading = false,
  cartCount = 0,
}: OrderStatusPageProps) {
  const [orderStep, setOrderStep] = useState<OrderStep>('received')
  const [estimatedPickupTime, setEstimatedPickupTime] = useState<string | null>(null)
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [trackingStoreLat, setTrackingStoreLat] = useState<number | null>(null)
  const [trackingStoreLng, setTrackingStoreLng] = useState<number | null>(null)
  const [trackingStoreAddress, setTrackingStoreAddress] = useState<string | null>(null)
  const completedNotifiedRef = useRef<number | null>(null)

  useEffect(() => {
    if (activeOrder?.orderStatus === 'REFUNDED') {
      setOrderStep('rejected')
      return
    }
    if (activeOrder?.pickupCompleted || activeOrder?.orderStatus === 'COMPLETED') {
      setOrderStep('completed')
    }
  }, [activeOrder])

  useEffect(() => {
    if (!activeOrder?.orderId) return
    if (orderStep === 'completed') {
      if (completedNotifiedRef.current === activeOrder.orderId) return
      completedNotifiedRef.current = activeOrder.orderId
      markLocalOrderPickupCompleted(activeOrder.orderId)
      onPickupComplete?.()
      return
    }
    if (orderStep === 'rejected') {
      if (completedNotifiedRef.current === activeOrder.orderId) return
      completedNotifiedRef.current = activeOrder.orderId
      markLocalOrderRejected(activeOrder.orderId)
      onPickupComplete?.()
    }
  }, [orderStep, activeOrder?.orderId, onPickupComplete])

  useEffect(() => {
    const orderId = activeOrder?.orderId
    if (!orderId || !getAccessToken()) return
    if (
      activeOrder?.pickupCompleted ||
      activeOrder?.orderStatus === 'COMPLETED' ||
      activeOrder?.orderStatus === 'REFUNDED'
    ) {
      return
    }

    let cancelled = false
    let trackingDone = false

    const poll = async () => {
      if (cancelled || trackingDone) return
      setTrackingLoading(true)
      try {
        const data = await fetchOrderTracking(orderId)
        if (cancelled) return
        setEstimatedPickupTime(data.estimatedPickupTime)
        if (data.storeLatitude != null && data.storeLongitude != null) {
          setTrackingStoreLat(data.storeLatitude)
          setTrackingStoreLng(data.storeLongitude)
        }
        if (data.storeAddress?.trim()) setTrackingStoreAddress(data.storeAddress.trim())
        const step = mapTrackingToOrderStep(data.trackingStatus, data.paymentOrderStatus)
        setOrderStep(step)
        if (step === 'completed' || step === 'rejected') trackingDone = true
      } catch {
        if (!cancelled && activeOrder?.orderStatus === 'COMPLETED') {
          setOrderStep('completed')
          trackingDone = true
        }
        if (!cancelled && activeOrder?.orderStatus === 'REFUNDED') {
          setOrderStep('rejected')
          trackingDone = true
        }
      } finally {
        if (!cancelled) setTrackingLoading(false)
      }
    }

    void poll()
    const intervalId = window.setInterval(() => void poll(), TRACKING_POLL_MS)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [activeOrder?.orderId, activeOrder?.orderStatus, activeOrder?.pickupCompleted])

  const display = useMemo(() => {
    if (!activeOrder) return emptyDisplay
    return {
      orderNumber: formatOrderNumber(activeOrder.orderId),
      pickupTime: formatPickupTime(estimatedPickupTime ?? activeOrder.createdAt),
      menuName: activeOrder.menuSummary?.trim() || '주문',
      storeId: activeOrder.storeId,
      storeName: activeOrder.storeName,
      storeAddress:
        trackingStoreAddress?.trim() ||
        pickupDestination?.address?.trim() ||
        '주소 정보 없음',
      distance: '',
      estimatedTime: '',
    }
  }, [activeOrder, pickupDestination, estimatedPickupTime, trackingStoreAddress])

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

  const currentStepIndex = steps.findIndex((s) => s.key === orderStep)

  const storeMapLat = trackingStoreLat ?? pickupDestination?.lat
  const storeMapLng = trackingStoreLng ?? pickupDestination?.lng

  const storeMapMarkers = useMemo((): MapTmapMarker[] => {
    if (storeMapLat == null || storeMapLng == null) return []
    return [
      {
        kind: 'destination',
        lat: storeMapLat,
        lng: storeMapLng,
        title: display.storeName,
        category: pickupDestination?.categoryName ?? '매장',
      },
    ]
  }, [storeMapLat, storeMapLng, display.storeName, pickupDestination?.categoryName])

  const storeCoords =
    storeMapLat != null && storeMapLng != null ? { lat: storeMapLat, lng: storeMapLng } : null
  const {
    distanceLabel: storeDistanceLabel,
    walkTimeLabel: storeWalkTimeLabel,
    loading: storeDistanceLoading,
    error: storeDistanceError,
    retry: retryStoreDistance,
  } = useDistanceToCoords(storeCoords)

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
          {storeDistanceError && (
            <LocationPermissionBanner
              message={storeDistanceError}
              onRetry={() => void retryStoreDistance()}
              loading={storeDistanceLoading}
            />
          )}
          <div className={styles.mapWrap}>
            {storeMapLat != null && storeMapLng != null ? (
              <MapTmapCanvas
                className={styles.mapIframe}
                center={{ lat: storeMapLat, lng: storeMapLng }}
                zoom={17}
                markers={storeMapMarkers}
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
                매장 좌표가 없습니다. 사장님이 주소를 등록하면 지도에 표시됩니다.
              </div>
            )}
            <div className={styles.distanceCard}>
              <div className={styles.distanceCardInner}>
                <div className={styles.distanceIconWrap}>
                  <span className={`material-symbols-outlined ${styles.distanceIcon}`}>directions_walk</span>
                </div>
                <div>
                  <p className={styles.distanceLabel}>가게까지 거리</p>
                  <p className={styles.distanceValue}>
                    {storeDistanceLoading
                      ? '위치 확인 중…'
                      : storeDistanceLabel || '—'}{' '}
                    {storeWalkTimeLabel && !storeDistanceLoading && (
                      <span className={styles.distanceTime}>({storeWalkTimeLabel})</span>
                    )}
                  </p>
                  {storeDistanceError && !storeDistanceLoading && (
                    <p style={{ fontSize: '0.65rem', color: 'rgb(220 38 38)', marginTop: '0.25rem' }}>
                      {storeDistanceError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.orderSection}>
            <div className={styles.orderRow}>
              <p className={styles.orderNumber}>주문 번호: {display.orderNumber}</p>
              <span className={styles.pickupBadge}>
                {orderStep === 'completed'
                  ? '픽업 완료'
                  : `픽업 ${display.pickupTime} 예정`}
              </span>
            </div>
            <h2 className={styles.orderTitle}>{display.menuName}</h2>
            {!pickupContextLoading && !activeOrder && orderStep !== 'completed' && (
              <p className={styles.pickupDoneHint} style={{ color: 'rgb(107 114 128)', marginTop: '0.5rem' }}>
                결제 완료(PAID) 주문이 없습니다. 장바구니에서 결제 후 다시 시도해 주세요.
              </p>
            )}
          </div>

          <div className={styles.stepsSection}>
            <div className={styles.stepsRow}>
              {steps.map((step, index) => {
                const status = getStepStatus(index)
                const connectorDone = status === 'completed'
                return (
                  <Fragment key={step.key}>
                    <div className={styles.stepItem}>
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
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`${styles.stepConnector} ${connectorDone ? styles.stepConnectorDone : styles.stepConnectorPending}`}
                        aria-hidden
                      />
                    )}
                  </Fragment>
                )
              })}
            </div>
            {orderStep === 'received' && (
              <div className={styles.cookingWaitBox}>
                <div className={styles.cookingWaitIcon}>
                  <span className={`material-symbols-outlined ${styles.cookingWaitIconSpan}`}>receipt_long</span>
                </div>
                <p className={styles.cookingWaitTitle}>주문이 접수되었어요</p>
                <p className={styles.cookingWaitDesc}>
                  {trackingLoading ? '매장 상태를 확인하는 중…' : '매장에서 주문을 확인하고 있어요.'}
                </p>
              </div>
            )}
            {orderStep === 'cooking' && (
              <div className={styles.cookingWaitBox}>
                <div className={styles.cookingWaitIcon}>
                  <span className={`material-symbols-outlined ${styles.cookingWaitIconSpan}`}>skillet</span>
                </div>
                <p className={styles.cookingWaitTitle}>조리 중이에요</p>
                <p className={styles.cookingWaitDesc}>
                  {estimatedPickupTime
                    ? `픽업 예정 ${formatPickupTime(estimatedPickupTime)}`
                    : '조리가 끝나면 픽업 준비 알림이 올 거예요.'}
                </p>
              </div>
            )}
            {orderStep === 'ready' && (
              <div className={styles.cookingWaitBox}>
                <div className={styles.cookingWaitIcon}>
                  <span className={`material-symbols-outlined ${styles.cookingWaitIconSpan}`}>inventory_2</span>
                </div>
                <p className={styles.cookingWaitTitle}>픽업 준비됐어요</p>
                <p className={styles.cookingWaitDesc}>
                  {estimatedPickupTime
                    ? `픽업 예정 ${formatPickupTime(estimatedPickupTime)} · 매장에서 수령해 주세요.`
                    : '매장에서 메뉴를 수령해 주세요. 픽업이 끝나면 상태가 완료로 바뀌어요.'}
                </p>
              </div>
            )}
            {orderStep === 'completed' && (
              <div className={styles.cookingWaitBox}>
                <div className={styles.cookingWaitIcon}>
                  <span className={`material-symbols-outlined ${styles.cookingWaitIconSpan}`}>celebration</span>
                </div>
                <p className={styles.cookingWaitTitle}>픽업 완료</p>
                <p className={styles.cookingWaitDesc}>주문이 모두 완료되었어요. 이용해 주셔서 감사합니다.</p>
                {onReviewWriteClick && activeOrder ? (
                  <button
                    type="button"
                    className={styles.reviewLinkBtn}
                    onClick={() => onReviewWriteClick(reviewPayload)}
                  >
                    리뷰 작성하기
                  </button>
                ) : null}
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
      </div>
    </Layout>
  )
}

export default OrderStatusPage
