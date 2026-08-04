import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { OwnerHeader } from '../../components/OwnerHeader'
import { Icon } from '../../components/Icon'
import SimpleAlertModal from '../../components/SimpleAlertModal/SimpleAlertModal'
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import { PickupTimeStepper } from '../../components/PickupTimeStepper/PickupTimeStepper'
import { useOwnerOrders } from '../../context/OwnerOrdersProvider'
import { useOwnerSales } from '../../context/OwnerSalesProvider'
import { useOwnerStoreDetail } from '../../hooks/useOwnerStoreDetail'
import { useOwnerCookingTime } from '../../hooks/useOwnerCookingTime'
import { useHorizontalDragScroll } from '../../hooks/useHorizontalDragScroll'
import { getActiveOwnerStoreProfile } from '../../lib/ownerSession'
import { ActiveOrderCard, NewOrderCard } from './orderCards'
import { OrderDetailPanel } from './OrderDetailPanel'
import styles from './OrdersPage.module.css'

export function OrdersPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { storeId, store, mockMode } = useOwnerStoreDetail()
  const ownerProfile = getActiveOwnerStoreProfile()
  const { baseMinutes, setBaseMinutes } = useOwnerCookingTime(storeId, store?.cookingTimeMinutes)
  const {
    newOrders,
    activeOrders,
    orders,
    handleStartCooking,
    handlePickupMinutesChange,
    handleCookDone,
    handlePickupDone,
    rejectOrder,
    simulateIncomingOrder,
    resetDemoOrders,
  } = useOwnerOrders()
  const { salesPaused, isScheduledPause, remainingMinutesLabel } = useOwnerSales()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null)
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertTitle, setAlertTitle] = useState('안내')
  const [alertMessage, setAlertMessage] = useState('')

  const storeLabel = ownerProfile?.storeName || store?.name

  const selectedOrder = useMemo(
    () => orders.find((o) => o.orderId === selectedId) ?? null,
    [orders, selectedId],
  )

  useEffect(() => {
    const fromNav = (location.state as { selectOrderId?: number } | null)?.selectOrderId
    if (fromNav != null && orders.some((o) => o.orderId === fromNav)) {
      setSelectedId(fromNav)
      navigate(location.pathname, { replace: true, state: {} })
      return
    }
  }, [location.state, location.pathname, orders, navigate])

  useEffect(() => {
    if (selectedId != null && orders.some((o) => o.orderId === selectedId)) return
    if (newOrders[0]) setSelectedId(newOrders[0].orderId)
    else if (activeOrders[0]) setSelectedId(activeOrders[0].orderId)
    else setSelectedId(null)
  }, [orders, newOrders, activeOrders, selectedId])

  const {
    scrollRef: newOrdersScrollRef,
    isDragging: isNewOrdersDragging,
    shouldIgnoreClick: shouldIgnoreNewOrderClick,
    handlers: newOrdersScrollHandlers,
    captureHandlers: newOrdersScrollCaptureHandlers,
  } = useHorizontalDragScroll()

  const confirmReject = () => {
    if (rejectTargetId == null) return
    rejectOrder(rejectTargetId)
    setRejectTargetId(null)
    setAlertTitle('주문 거절')
    setAlertMessage('주문을 거절했습니다. (로컬 POS · 고객 알림 API는 추후 연동)')
    setAlertOpen(true)
  }

  const showPrintStub = () => {
    setAlertTitle('주문지 출력')
    setAlertMessage('예시 모드: 주문지 출력은 프린터 API 연동 후 동작합니다.')
    setAlertOpen(true)
  }

  const hasNew = newOrders.length > 0
  const cookingCount = activeOrders.filter((o) => o.status === 'progress').length
  const readyCount = activeOrders.filter((o) => o.status === 'ready').length

  return (
    <>
      <OwnerHeader
        title="실시간 주문"
        subtitle={mockMode ? `${storeLabel ?? ''} · 로컬 POS` : storeLabel}
        right={
          <Link to="/orders/completed" className={styles.completedLink}>
            <Icon name="task_alt" style={{ fontSize: '1rem' }} />
            완료 주문
          </Link>
        }
      />

      <main className={styles.main}>
        <section className={styles.pickupToolbar} aria-label="매장 기본 픽업 시간">
          <PickupTimeStepper
            label="기본 조리·픽업 시간"
            hint="신규 주문에서 픽업 시간을 정한 뒤 수락·조리 시작하세요."
            minutes={baseMinutes}
            onChange={setBaseMinutes}
          />
          <div className={styles.toolbarActions}>
            <button type="button" className={styles.mockIncomingBtn} onClick={simulateIncomingOrder}>
              테스트 주문 들어오기
            </button>
            <button type="button" className={styles.resetDemoBtn} onClick={resetDemoOrders}>
              예시 데이터 초기화
            </button>
          </div>
        </section>

        <div className={styles.boardWithDetail}>
          <div className={styles.liveBoard}>
            <section
              className={[styles.newZone, hasNew ? styles.newZoneAlert : styles.newZoneIdle].filter(Boolean).join(' ')}
              aria-live="polite"
            >
              <div className={styles.zoneHead}>
                <h2 className={styles.zoneTitle}>
                  <Icon name="notifications_active" />
                  신규 주문
                  {hasNew ? <span className={`${styles.zoneCount} ${styles.monoNum}`}>{newOrders.length}</span> : null}
                </h2>
                <p className={styles.zoneHint}>
                  {hasNew ? '카드 선택 → 우측에서 상세·수락/거절' : '새 주문이 들어오면 이곳에 표시됩니다'}
                </p>
              </div>

              {hasNew ? (
                <div
                  ref={newOrdersScrollRef}
                  className={[styles.newGrid, isNewOrdersDragging ? styles.newGridDragging : '']
                    .filter(Boolean)
                    .join(' ')}
                  {...newOrdersScrollHandlers}
                  {...newOrdersScrollCaptureHandlers}
                >
                  {newOrders.map((o) => (
                    <NewOrderCard
                      key={o.orderId}
                      order={o}
                      baseMinutes={baseMinutes}
                      selected={selectedId === o.orderId}
                      onSelect={setSelectedId}
                      shouldIgnoreClick={shouldIgnoreNewOrderClick}
                    />
                  ))}
                </div>
              ) : (
                <div className={styles.newEmpty}>
                  <Icon name="check_circle" style={{ fontSize: '2rem', opacity: 0.4 }} />
                  <p>대기 중인 신규 주문이 없습니다</p>
                </div>
              )}
            </section>

            <section className={styles.cookingZone}>
              <div className={styles.zoneHead}>
                <h2 className={styles.zoneTitle}>
                  <Icon name="skillet" />
                  조리 중 · 픽업 대기
                  <span className={`${styles.zoneCountMuted} ${styles.monoNum}`}>{activeOrders.length}</span>
                </h2>
                <div className={styles.cookingStats}>
                  {cookingCount > 0 ? <span className={styles.statCooking}>조리 {cookingCount}</span> : null}
                  {readyCount > 0 ? <span className={styles.statReady}>픽업 대기 {readyCount}</span> : null}
                </div>
              </div>

              {activeOrders.length === 0 ? (
                <div className={styles.cookingEmpty}>
                  <Icon name="soup_kitchen" style={{ fontSize: '2.5rem', opacity: 0.35 }} />
                  <p>진행 중인 주문이 없습니다</p>
                  <p className={styles.cookingEmptyHint}>신규 주문에서 수락·조리 시작을 누르면 여기에 표시됩니다</p>
                </div>
              ) : (
                <div className={styles.activeGrid}>
                  {activeOrders.map((o) => (
                    <ActiveOrderCard
                      key={o.orderId}
                      order={o}
                      baseMinutes={baseMinutes}
                      selected={selectedId === o.orderId}
                      onSelect={setSelectedId}
                    />
                  ))}
                </div>
              )}
            </section>

            <Link
              to="/sales"
              className={[styles.statusFab, salesPaused ? styles.statusFabPaused : ''].filter(Boolean).join(' ')}
            >
              <div className={styles.statusFabInner}>
                <span
                  className={[styles.statusDot, salesPaused ? styles.statusDotPaused : ''].filter(Boolean).join(' ')}
                />
                <span className={styles.statusText}>로컬 POS</span>
              </div>
              <div className={styles.divider} />
              <span className={styles.statusOpenLabel}>
                {salesPaused ? (
                  isScheduledPause && remainingMinutesLabel ? (
                    <>
                      일시 중지
                      <span className={styles.statusRemain}>{remainingMinutesLabel}</span>
                    </>
                  ) : isScheduledPause ? (
                    '일시 중지'
                  ) : (
                    '영업 중지'
                  )
                ) : (
                  '영업 중'
                )}
              </span>
            </Link>
          </div>

          <OrderDetailPanel
            order={selectedOrder}
            baseMinutes={baseMinutes}
            onPickupMinutesChange={handlePickupMinutesChange}
            onStartCooking={handleStartCooking}
            onReject={setRejectTargetId}
            onCookDone={handleCookDone}
            onPickupDone={handlePickupDone}
            onPrint={showPrintStub}
          />
        </div>
      </main>

      <ConfirmModal
        open={rejectTargetId != null}
        title="주문 거절"
        message="이 주문을 거절할까요? 목록에서 제거됩니다."
        confirmLabel="거절"
        confirmTone="danger"
        onCancel={() => setRejectTargetId(null)}
        onConfirm={confirmReject}
      />

      <SimpleAlertModal
        open={alertOpen}
        title={alertTitle}
        message={alertMessage}
        variant="info"
        onClose={() => setAlertOpen(false)}
      />
    </>
  )
}
