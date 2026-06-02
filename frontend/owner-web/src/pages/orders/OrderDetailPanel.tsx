import { useEffect, useRef, useState } from 'react'
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import { Icon } from '../../components/Icon'
import { PickupTimeStepper } from '../../components/PickupTimeStepper/PickupTimeStepper'
import { formatPrice } from '../../lib/format'
import {
  formatPickupEtaLabel,
  formatPickupPreviewLabel,
  isPickupTimeLocked,
  resolvePickupMinutes,
} from '../../lib/ownerPickupTime'
import type { MockOwnerOrder } from '../../lib/mocks/ownerMockData'
import styles from './OrdersPage.module.css'

type OrderDetailPanelProps = {
  order: MockOwnerOrder | null
  baseMinutes: number
  onPickupMinutesChange: (id: number, adjustMinutes: number) => void
  onStartCooking: (id: number) => void
  onReject: (id: number) => void
  onCookDone: (id: number) => void
  onPickupDone: (id: number) => void
  onPrint?: () => void
  /** 완료 주문 등: 오른쪽 영역을 넓게 채움 */
  layout?: 'dock' | 'wide'
}

/** 조리 완료 직후 같은 위치에 픽업 완료가 뜨며 연속 탭되는 것 방지 */
const COOK_DONE_GUARD_MS = 2_000

function statusLabel(order: MockOwnerOrder): string {
  if (order.status === 'new') return '신규'
  if (order.status === 'ready') return '픽업 대기'
  if (order.status === 'progress') return '조리 중'
  if (order.status === 'completed') return '픽업 완료'
  return order.label
}

export function OrderDetailPanel({
  order,
  baseMinutes,
  onPickupMinutesChange,
  onStartCooking,
  onReject,
  onCookDone,
  onPickupDone,
  onPrint,
  layout = 'dock',
}: OrderDetailPanelProps) {
  const paneClass = layout === 'wide' ? styles.detailPaneWide : styles.detailPane
  const [pickupConfirmOpen, setPickupConfirmOpen] = useState(false)
  const [cookDoneGuardId, setCookDoneGuardId] = useState<number | null>(null)
  const guardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setPickupConfirmOpen(false)
    setCookDoneGuardId(null)
    if (guardTimerRef.current) {
      clearTimeout(guardTimerRef.current)
      guardTimerRef.current = null
    }
  }, [order?.orderId])

  useEffect(() => {
    return () => {
      if (guardTimerRef.current) clearTimeout(guardTimerRef.current)
    }
  }, [])

  const startCookDoneGuard = (orderId: number) => {
    setCookDoneGuardId(orderId)
    if (guardTimerRef.current) clearTimeout(guardTimerRef.current)
    guardTimerRef.current = setTimeout(() => {
      setCookDoneGuardId((prev) => (prev === orderId ? null : prev))
      guardTimerRef.current = null
    }, COOK_DONE_GUARD_MS)
  }

  const handleCookDoneClick = () => {
    if (!order) return
    onCookDone(order.orderId)
    startCookDoneGuard(order.orderId)
  }

  const confirmPickupDone = () => {
    if (!order) return
    onPickupDone(order.orderId)
    setPickupConfirmOpen(false)
  }

  if (!order) {
    return (
      <aside className={paneClass} aria-label="주문 상세">
        <div className={styles.detailEmpty}>
          <Icon name="touch_app" style={{ fontSize: '2.5rem', opacity: 0.35 }} />
          <p className={styles.detailEmptyTitle}>주문을 선택하세요</p>
          <p className={styles.detailEmptyHint}>카드를 누르면 메뉴·결제·요청사항이 표시됩니다</p>
        </div>
      </aside>
    )
  }

  const isNew = order.status === 'new'
  const isReady = order.status === 'ready'
  const isProgress = order.status === 'progress'
  const isCompleted = order.status === 'completed'
  const showCookDoneGuard = isReady && cookDoneGuardId === order.orderId
  const locked = isPickupTimeLocked(order)
  const adjust = order.pickupAdjustMinutes ?? 0
  const pickupMinutes = resolvePickupMinutes(baseMinutes, adjust)
  const adjustHint = locked
    ? '조리 시작 후 변경할 수 없습니다'
    : adjust === 0
      ? '매장 기본과 동일 · 조리 시작 시 확정'
      : `기본 대비 ${adjust > 0 ? '+' : ''}${adjust}분`

  return (
    <aside className={paneClass} aria-label={`주문 상세 ${order.orderNo}`}>
      <div className={styles.detailHead}>
        <div>
          <p className={styles.detailEyebrow}>{statusLabel(order)}</p>
          <h2 className={`${styles.detailOrderNo} ${styles.monoNum}`}>#{order.orderNo}</h2>
          <p className={styles.detailMeta}>{order.orderedAtLabel}</p>
        </div>
      </div>

      <div className={styles.detailScroll}>
        <section className={styles.detailSection}>
          <h3 className={styles.detailSectionTitle}>픽업 시간</h3>
          {locked ? (
            <div className={styles.pickupLocked}>
              <Icon name="schedule" style={{ fontSize: '1.125rem' }} />
              <div className={styles.pickupLockedText}>
                <span className={styles.activeCardEta}>
                  {formatPickupEtaLabel(order.acceptedAtMs, pickupMinutes)}
                </span>
                <span className={styles.pickupLockedHint}>조리 시작 시 확정됨</span>
              </div>
              <span className={styles.pickupLockedBadge}>확정</span>
            </div>
          ) : (
            <>
              <p className={styles.detailPickupPreview}>{formatPickupPreviewLabel(pickupMinutes)}</p>
              <PickupTimeStepper
                compact
                label="픽업 시간 설정"
                hint={adjustHint}
                minutes={pickupMinutes}
                onChange={(next) => onPickupMinutesChange(order.orderId, next - baseMinutes)}
              />
            </>
          )}
        </section>

        <section className={styles.detailSection}>
          <h3 className={styles.detailSectionTitle}>주문 메뉴</h3>
          <ul className={styles.detailItems}>
            {order.items.map((line, idx) => (
              <li key={idx} className={styles.detailLine}>
                <div className={styles.detailLineLeft}>
                  <span className={styles.detailLineIdx}>{idx + 1}</span>
                  <div>
                    <p className={styles.detailLineName}>{line.name}</p>
                    {line.option ? <p className={styles.detailLineOpt}>옵션: {line.option}</p> : null}
                  </div>
                </div>
                <span className={`${styles.detailLinePrice} ${styles.monoNum}`}>{formatPrice(line.price)}</span>
              </li>
            ))}
          </ul>
        </section>

        {order.customerNote ? (
          <section className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle}>고객 요청</h3>
            <div className={styles.detailNote}>
              <Icon name="chat_bubble" />
              <p>{order.customerNote}</p>
            </div>
          </section>
        ) : null}

        <section className={styles.detailSection}>
          <h3 className={styles.detailSectionTitle}>결제</h3>
          <div className={styles.detailPay}>
            <div className={styles.detailPayRow}>
              <span>주문 금액</span>
              <span className={styles.monoNum}>{formatPrice(order.subtotal)}</span>
            </div>
            {order.discount > 0 ? (
              <div className={styles.detailPayRow}>
                <span>할인</span>
                <span className={`${styles.monoNum} ${styles.detailDiscount}`}>
                  -{formatPrice(order.discount)}
                </span>
              </div>
            ) : null}
            <div className={styles.detailPayTotal}>
              <span>합계</span>
              <span className={`${styles.detailTotalAmt} ${styles.monoNum}`}>{formatPrice(order.total)}</span>
            </div>
            <p className={styles.detailPayMethod}>{order.paymentMethod}</p>
          </div>
        </section>
      </div>

      <div className={styles.detailActions}>
        {isCompleted ? (
          <p className={styles.detailCompletedMsg}>
            <Icon name="task_alt" />
            픽업이 완료된 주문입니다
          </p>
        ) : null}

        {onPrint && !isNew && !isCompleted ? (
          <button type="button" className={styles.btnDetailSecondary} onClick={onPrint}>
            <Icon name="print" />
            주문지 출력
          </button>
        ) : null}

        {isNew ? (
          <>
            <button type="button" className={styles.btnAcceptLarge} onClick={() => onStartCooking(order.orderId)}>
              <Icon name="skillet" />
              조리 시작
            </button>
            <button type="button" className={styles.btnReject} onClick={() => onReject(order.orderId)}>
              거절
            </button>
          </>
        ) : null}

        {isProgress ? (
          <button
            type="button"
            className={`${styles.btnAcceptLarge} ${styles.btnAcceptCookDone}`}
            onClick={handleCookDoneClick}
          >
            <Icon name="restaurant" />
            조리 완료
          </button>
        ) : null}

        {isReady && showCookDoneGuard ? (
          <div className={styles.cookDoneGuard} role="status">
            <Icon name="check_circle" style={{ fontSize: '2rem', color: '#22c55e' }} />
            <p className={styles.cookDoneGuardTitle}>조리 완료됨</p>
            <p className={styles.cookDoneGuardHint}>픽업 대기 중 · 잠시 후 픽업 완료 버튼이 나타납니다</p>
          </div>
        ) : null}

        {isReady && !showCookDoneGuard ? (
          <>
            <p className={styles.pickupReadyHint}>
              <Icon name="person" style={{ fontSize: '1rem', verticalAlign: 'middle' }} /> 고객이
              픽업했을 때만 눌러 주세요
            </p>
            <button
              type="button"
              className={`${styles.btnAcceptLarge} ${styles.btnAcceptPickup}`}
              onClick={() => setPickupConfirmOpen(true)}
            >
              <Icon name="shopping_bag" />
              픽업 완료
            </button>
          </>
        ) : null}
      </div>

      <ConfirmModal
        open={pickupConfirmOpen}
        title="픽업 완료 확인"
        message={`#${order.orderNo} 주문을 픽업 완료 처리할까요?\n고객이 매장에서 수령한 뒤에만 눌러 주세요. 완료 후 실시간 목록에서 빠집니다.`}
        confirmLabel="픽업 완료"
        confirmTone="primary"
        onCancel={() => setPickupConfirmOpen(false)}
        onConfirm={confirmPickupDone}
      />
    </aside>
  )
}
