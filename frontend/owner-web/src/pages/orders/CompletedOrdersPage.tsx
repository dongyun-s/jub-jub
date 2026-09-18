import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { OwnerHeader } from '../../components/OwnerHeader'
import { Icon } from '../../components/Icon'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { useOwnerOrders } from '../../context/OwnerOrdersProvider'
import { useOwnerStoreDetail } from '../../hooks/useOwnerStoreDetail'
import { useOwnerCookingTime } from '../../hooks/useOwnerCookingTime'
import { formatOwnerOrderNo, formatPrice } from '../../lib/format'
import { OrderDetailPanel } from './OrderDetailPanel'
import styles from './CompletedOrdersPage.module.css'

const noop = () => {}

export function CompletedOrdersPage() {
  const { storeId, store, mockMode } = useOwnerStoreDetail()
  const { baseMinutes } = useOwnerCookingTime(storeId, store?.cookingTimeMinutes)
  const { completedOrders } = useOwnerOrders()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const selectedOrder = useMemo(
    () => completedOrders.find((o) => o.orderId === selectedId) ?? null,
    [completedOrders, selectedId],
  )

  useEffect(() => {
    if (completedOrders.length === 0) {
      setSelectedId(null)
      return
    }
    if (selectedId == null || !completedOrders.some((o) => o.orderId === selectedId)) {
      setSelectedId(completedOrders[0].orderId)
    }
  }, [completedOrders, selectedId])

  return (
    <>
      <OwnerHeader
        title="완료 주문"
        subtitle={mockMode ? `${store?.name ?? ''} · 예시 데이터` : store?.name}
        right={
          <Link to="/orders" className={styles.liveLink}>
            <Icon name="receipt_long" style={{ fontSize: '1rem' }} />
            실시간 주문
          </Link>
        }
      />

      <main className={styles.main}>
        <div className={styles.toolbar}>
          <div>
            <p className={styles.toolbarText}>
              오늘 완료 <strong className={styles.monoNum}>{completedOrders.length}</strong>건
            </p>
            {completedOrders.length > 0 ? (
              <p className={styles.toolbarHint}>왼쪽에서 주문을 고르고 오른쪽에서 상세를 확인하세요</p>
            ) : null}
          </div>
          <Link to="/orders" className={styles.backBtn}>
            주방 화면으로
          </Link>
        </div>

        {completedOrders.length === 0 ? (
          <EmptyState
            icon="task_alt"
            title="완료된 주문이 없습니다"
            description="픽업 완료·거절된 주문이 이곳에 쌓입니다."
          />
        ) : (
          <div className={styles.boardWithDetail}>
            <section className={styles.listPane} aria-label="완료 주문 목록">
              <div className={styles.listPaneHead}>
                <h2 className={styles.listPaneTitle}>
                  <Icon name="task_alt" />
                  완료 목록
                </h2>
              </div>
              <ul className={styles.list}>
                {completedOrders.map((o) => {
                  const selected = selectedId === o.orderId
                  return (
                    <li key={o.orderId}>
                      <button
                        type="button"
                        className={[styles.row, selected ? styles.rowSelected : ''].filter(Boolean).join(' ')}
                        onClick={() => setSelectedId(o.orderId)}
                      >
                        <div className={styles.rowMain}>
                          <span
                            className={`${styles.orderNo} ${styles.monoNum}`}
                            title={o.orderNo}
                          >
                            #{formatOwnerOrderNo(o.orderNo, o.orderId)}
                          </span>
                          <span className={styles.summary}>{o.summary}</span>
                          {o.rejected ? <span className={styles.rejectedPill}>거절</span> : null}
                        </div>
                        <div className={styles.rowSide}>
                          <span className={styles.time}>{o.time}</span>
                          <span className={`${styles.amount} ${styles.monoNum}`}>{formatPrice(o.total)}</span>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>

            <OrderDetailPanel
              layout="wide"
              order={selectedOrder}
              baseMinutes={baseMinutes}
              onPickupMinutesChange={noop}
              onStartCooking={noop}
              onReject={noop}
              onCookDone={noop}
              onPickupDone={noop}
            />
          </div>
        )}
      </main>
    </>
  )
}
