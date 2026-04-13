/**
 * OrderStatusPage.tsx
 * 주문 현황 페이지 (결제 후 또는 주문내역/홈 배너에서 진입)
 * - 픽업 매장 지도, 주문접수→조리중→픽업준비→픽업완료 단계 표시, 주문 요약
 */

import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import BottomNav from '../../components/BottomNav'
import PickupRewardModal from '../../components/PickupRewardModal/PickupRewardModal'
import { FEATURED_RESTAURANTS } from '../../constants'
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
  /** 픽업 리워드 모달에서 리뷰 작성으로 이동 */
  onReviewWriteClick?: (storeName: string) => void
  /**
   * 매장에서 픽업 완료 처리 시 — App에서 진행 주문 플래그 해제(홈·지도·주문내역 등)
   */
  onPickupComplete?: () => void
  cartCount?: number
}

type OrderStep = 'received' | 'cooking' | 'ready' | 'completed'

/** 조리중 → 픽업준비(조리 완료) 자동 전환 대기 시간 (ms) */
const COOKING_TO_READY_MS = 15_000

/** 현재 주문 정보 (데모) — 픽업 매장 id는 FEATURED_RESTAURANTS 와 맞춤 */
const orderData = {
  orderNumber: '20231024-001',
  pickupTime: '15:15',
  menuName: '예시 주문 1건',
  storeId: FEATURED_RESTAURANTS[0].id,
  storeName: FEATURED_RESTAURANTS[0].title,
  storeAddress: '서울 강남구 테헤란로 123 (데모)',
  distance: '지도·경로 탭',
  estimatedTime: '에서 확인',
  /** 진입 시 조리중 → COOKING_TO_READY_MS 후 픽업준비, 그때 픽업 완료 버튼 표시 */
  currentStep: 'cooking' as OrderStep,
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
  onReviewWriteClick,
  onPickupComplete,
  cartCount = 0,
}: OrderStatusPageProps) {
  const [orderStep, setOrderStep] = useState<OrderStep>(orderData.currentStep)
  const [rewardModalOpen, setRewardModalOpen] = useState(false)
  const [cookingSecondsLeft, setCookingSecondsLeft] = useState(
    Math.ceil(COOKING_TO_READY_MS / 1000),
  )

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

  const completePickup = () => {
    setOrderStep('completed')
    setRewardModalOpen(true)
    onPickupComplete?.()
  }

  const handleRewardClose = () => {
    setRewardModalOpen(false)
  }

  const handleReviewFromModal = () => {
    setRewardModalOpen(false)
    onReviewWriteClick?.(orderData.storeName)
  }

  const pickupStore =
    FEATURED_RESTAURANTS.find((r) => r.id === orderData.storeId) ?? FEATURED_RESTAURANTS[0]
  const storeMapLat = pickupStore.lat
  const storeMapLng = pickupStore.lng

  /** 단계별 상태: 완료 / 진행중 / 대기 */
  const getStepStatus = (index: number) => {
    if (index < currentStepIndex) return 'completed'
    if (index === currentStepIndex) return 'active'
    return 'pending'
  }

  return (
    <Layout showBackground={false}>
      <div className={styles.root}>
        <header className={styles.header}>
          <button onClick={onBack} className={styles.backButton}>
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
                markers={[{ lat: storeMapLat, lng: storeMapLng, title: orderData.storeName }]}
                fitMarkers={false}
              />
            ) : (
              <div className={styles.mapIframe} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgb(243 244 246)', color: 'rgb(107 114 128)', fontSize: '0.875rem' }}>
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
                    {orderData.distance} <span className={styles.distanceTime}>({orderData.estimatedTime})</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.orderSection}>
            <div className={styles.orderRow}>
              <p className={styles.orderNumber}>주문 번호: {orderData.orderNumber}</p>
              <span className={styles.pickupBadge}>
                {orderStep === 'completed' ? '픽업 완료' : `픽업 ${orderData.pickupTime} 예정`}
              </span>
            </div>
            <h2 className={styles.orderTitle}>{orderData.menuName}</h2>
          </div>

          <div className={styles.stepsSection}>
            <div className={styles.stepsRow}>
              {steps.map((step, index) => {
                const status = getStepStatus(index)
                return (
                  <div key={step.key} className={styles.stepItem}>
                    <div className={`${styles.stepIcon} ${
                      status === 'completed' ? styles.stepIconCompleted :
                      status === 'active' ? styles.stepIconActive : styles.stepIconPending
                    }`}>
                      <span className={`material-symbols-outlined ${styles.stepIconSpan}`}>
                        {status === 'completed' ? 'check' : step.icon}
                      </span>
                    </div>
                    <p className={`${styles.stepLabel} ${
                      status === 'active' ? styles.stepLabelActive :
                      status === 'completed' ? styles.stepLabelCompleted : styles.stepLabelPending
                    }`}>
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
                <button type="button" className={styles.pickupDoneButton} onClick={completePickup}>
                  <span className="material-symbols-outlined">verified</span>
                  매장에서 픽업을 완료했어요
                </button>
                <p className={styles.pickupDoneHint}>버튼을 눌러 리워드를 지급받으세요.</p>
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
                  <h3 className={styles.storeCardName}>{orderData.storeName}</h3>
                  <p className={styles.storeCardAddress}>
                    <span className={`material-symbols-outlined ${styles.storeCardAddressIcon}`}>location_on</span>
                    {orderData.storeAddress}
                  </p>
                </div>
              </div>
              <button onClick={onMapClick} className={styles.navButton}>
                <span className="material-symbols-outlined">directions</span>
                길찾기 보러가기
              </button>
            </div>
          </div>
        </div>

        {/* 하단 네비게이션 */}
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
          storeName={orderData.storeName}
          onWriteReview={onReviewWriteClick ? handleReviewFromModal : undefined}
        />
      </div>
    </Layout>
  )
}

export default OrderStatusPage
