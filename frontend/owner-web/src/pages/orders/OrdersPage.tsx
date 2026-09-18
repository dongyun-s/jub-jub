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
import { resolvePickupMinutes } from '../../lib/ownerPickupTime'
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
    useMock,
    error: ordersError,
    handleStartCooking,
    handlePickupMinutesChange,
    handleCookDone,
    handlePickupDone,
    rejectOrder,
    simulateIncomingOrder,
    resetDemoOrders,
    loadOrderDetail,
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
    if (selectedId == null || useMock) return
    void loadOrderDetail(selectedId)
  }, [selectedId, useMock, loadOrderDetail])

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

  const runAction = async (fn: () => Promise<void>, failTitle: string) => {
    try {
      await fn()
    } catch (e) {
      const msg = e instanceof Error ? e.message : '요청에 실패했습니다.'
      setAlertTitle(failTitle)
      setAlertMessage(msg)
      setAlertOpen(true)
    }
  }

  const {
    scrollRef: newOrdersScrollRef,
    isDragging: isNewOrdersDragging,
    shouldIgnoreClick: shouldIgnoreNewOrderClick,
    handlers: newOrdersScrollHandlers,
    captureHandlers: newOrdersScrollCaptureHandlers,
  } = useHorizontalDragScroll()

  const confirmReject = () => {
    if (rejectTargetId == null) return
    const id = rejectTargetId
    setRejectTargetId(null)
    void runAction(
      () => rejectOrder(id, '재료 소진 등으로 주문을 받을 수 없습니다.'),
      '주문 거절 실패',
    )
  }

  const showPrintStub = () => {
    setAlertTitle('주문지 출력')
    setAlertMessage(useMock ? '예시 모드: 프린터 API 연동 후 동작합니다.' : '프린터 연동 준비 중입니다.')
    setAlertOpen(true)
  }

  const hasNew = newOrders.length > 0
  const cookingCount = activeOrders.filter((o) => o.status === 'progress').length
  const readyCount = activeOrders.filter((o) => o.status === 'ready').length

  return (
    <>
      <OwnerHeader
        title="실시간 주문"
        subtitle={useMock || mockMode ? `${storeLabel ?? ''} · 로컬 POS` : storeLabel}
        right={
          <Link to="/orders/completed" className={styles.completedLink}>
            <Icon name="task_alt" style={{ fontSize: '1rem' }} />
            완료 주문
          </Link>
        }
      />

      <main className={styles.main}>
        {ordersError ? <p style={{ color: '#b91c1c', margin: '0 0 0.75rem' }}>{ordersError}</p> : null}
        <section className={styles.pickupToolbar} aria-label="매장 기본 픽업 시간">
          <PickupTimeStepper
            label="기본 조리·픽업 시간"
            hint="신규 주문에서 픽업 시간을 정한 뒤 수락·조리 시작하세요."
            minutes={baseMinutes}
            onChange={setBaseMinutes}
          />
          {useMock ? (
            <div className={styles.toolbarActions}>
              <button type="button" className={styles.mockIncomingBtn} onClick={simulateIncomingOrder}>
                테스트 주문 들어오기
              </button>
              <button type="button" className={styles.resetDemoBtn} onClick={resetDemoOrders}>
                예시 데이터 초기화
              </button>
            </div>
          ) : null}
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
                      newOrders={newOrders}
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
                <span className={styles.statusText}>{useMock ? '로컬 POS' : '실시간'}</span>
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
            newOrders={newOrders}
            allowPickupAdjust
            onPickupMinutesChange={handlePickupMinutesChange}
            onStartCooking={(id, cookingMinutes) => {
              const order = orders.find((o) => o.orderId === id)
              const mins =
                cookingMinutes ??
                resolvePickupMinutes(baseMinutes, order?.pickupAdjustMinutes ?? 0)
              void runAction(() => handleStartCooking(id, mins), '수락 실패')
            }}
            onReject={setRejectTargetId}
            onCookDone={(id) => void runAction(() => handleCookDone(id), '조리 완료 실패')}
            onPickupDone={(id) => void runAction(() => handlePickupDone(id), '픽업 완료 실패')}
            onPrint={showPrintStub}
          />
        </div>
      </main>

      <ConfirmModal
        open={rejectTargetId != null}
        title="주문 거절"
        message="이 주문을 거절할까요? 전액 환불·쿠폰 복구가 함께 처리됩니다."
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
