/**
 * OrderStatusPage.tsx
 * 주문 현황 페이지 (결제 후 또는 주문내역/홈 배너에서 진입)
 * - 픽업 매장 지도, 주문접수→조리중→픽업준비→픽업완료 단계 표시, 주문 요약
 */

import Layout from '../../components/Layout'
import BottomNav from '../../components/BottomNav'
import styles from './OrderStatusPage.module.css'

interface OrderStatusPageProps {
  onBack: () => void
  onGoHome?: () => void
  onCartClick?: () => void
  onOrdersClick?: () => void
  onMapClick?: () => void
  onMypageClick?: () => void
  onFavoritesClick?: () => void
  cartCount?: number
}

type OrderStep = 'received' | 'cooking' | 'ready' | 'completed'

/** 현재 주문 정보 (데모) */
const orderData = {
  orderNumber: '20231024-001',
  pickupTime: '15:15',
  menuName: '더 바삭 돈카츠 외 1건',
  storeName: '바삭카츠 강남점',
  storeAddress: '서울특별시 강남구 테헤란로 123',
  distance: '180m',
  estimatedTime: '약 3분',
  currentStep: 'cooking' as OrderStep,
}

const steps: { key: OrderStep; label: string; icon: string }[] = [
  { key: 'received', label: '주문접수', icon: 'check_circle' },
  { key: 'cooking', label: '조리중', icon: 'skillet' },
  { key: 'ready', label: '픽업준비', icon: 'inventory_2' },
  { key: 'completed', label: '픽업완료', icon: 'celebration' },
]

function OrderStatusPage({ onBack, onGoHome, onCartClick, onOrdersClick, onMapClick, onMypageClick, onFavoritesClick: _onFavoritesClick, cartCount = 0 }: OrderStatusPageProps) {
  const currentStepIndex = steps.findIndex((s) => s.key === orderData.currentStep)

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
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3165.2!2d127.0276!3d37.4979!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzfCsDI5JzUyLjQiTiAxMjfCsDAxJzM5LjQiRQ!5e0!3m2!1sko!2skr!4v1"
              width="100%"
              height="100%"
              className={styles.mapIframe}
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="픽업 위치"
            />
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
              <span className={styles.pickupBadge}>픽업 {orderData.pickupTime} 예정</span>
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
      </div>
    </Layout>
  )
}

export default OrderStatusPage
