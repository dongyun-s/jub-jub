import { Icon } from '../../components/Icon'
import { formatOwnerOrderNo, formatPrice } from '../../lib/format'
import {
  countWaitingOrdersAhead,
  formatNewOrderPickupLabel,
  formatPickupEtaDisplay,
  formatWaitingQueueHint,
  resolvePickupMinutes,
} from '../../lib/ownerPickupTime'
import type { MockOwnerOrder } from '../../lib/mocks/ownerMockData'
import styles from './OrdersPage.module.css'

type OrderCardBaseProps = {
  order: MockOwnerOrder
  baseMinutes: number
  selected: boolean
  onSelect: (id: number) => void
  shouldIgnoreClick?: () => boolean
  /** 신규 큐(수락 대기) — 대기 주문 반영 힌트용 */
  newOrders?: MockOwnerOrder[]
}

function guardSelect(shouldIgnoreClick: (() => boolean) | undefined, id: number, onSelect: (id: number) => void) {
  if (shouldIgnoreClick?.()) return
  onSelect(id)
}

export function NewOrderCard({
  order,
  baseMinutes,
  selected,
  onSelect,
  shouldIgnoreClick,
  newOrders = [],
}: OrderCardBaseProps) {
  const pickupMinutes = resolvePickupMinutes(baseMinutes, order.pickupAdjustMinutes ?? 0)
  const waitingAhead = countWaitingOrdersAhead(order.orderId, newOrders)
  const waitingHint = formatWaitingQueueHint(waitingAhead)
  const shortNo = formatOwnerOrderNo(order.orderNo, order.orderId)

  return (
    <button
      type="button"
      className={[styles.orderCardBtn, styles.orderCardNew, selected ? styles.orderCardSelected : '']
        .filter(Boolean)
        .join(' ')}
      aria-label={`신규 주문 ${order.orderNo}`}
      title={`주문번호 ${order.orderNo}`}
      aria-pressed={selected}
      onClick={() => guardSelect(shouldIgnoreClick, order.orderId, onSelect)}
    >
      <div className={styles.orderCardTop}>
        <span className={`${styles.orderCardNo} ${styles.monoNum}`}>#{shortNo}</span>
        <span className={styles.badgeNew}>신규</span>
      </div>
      <p className={styles.orderCardSummary}>{order.summary}</p>
      <p className={styles.orderCardPickup}>
        {formatNewOrderPickupLabel(order.estimatedPickupTime, pickupMinutes)}
      </p>
      {waitingHint ? <p className={styles.orderCardQueueHint}>{waitingHint}</p> : null}
      <div className={styles.orderCardFoot}>
        <span className={styles.orderCardTime}>{order.time}</span>
        <span className={`${styles.orderCardAmount} ${styles.monoNum}`}>{formatPrice(order.total)}</span>
      </div>
    </button>
  )
}

export function ActiveOrderCard({ order, baseMinutes, selected, onSelect }: OrderCardBaseProps) {
  const isReady = order.status === 'ready'
  const pickupMinutes = resolvePickupMinutes(baseMinutes, order.pickupAdjustMinutes ?? 0)
  const shortNo = formatOwnerOrderNo(order.orderNo, order.orderId)

  return (
    <button
      type="button"
      className={[
        styles.orderCardBtn,
        styles.orderCardActive,
        isReady ? styles.orderCardReady : '',
        selected ? styles.orderCardSelected : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={`주문 ${order.orderNo}`}
      title={`주문번호 ${order.orderNo}`}
      aria-pressed={selected}
      onClick={() => onSelect(order.orderId)}
    >
      <div className={styles.orderCardTop}>
        <span className={`${styles.orderCardNo} ${styles.monoNum}`}>#{shortNo}</span>
        <span className={isReady ? styles.badgeReady : styles.badgeCooking}>
          {isReady ? '픽업 대기' : '조리 중'}
        </span>
      </div>
      <p className={styles.orderCardSummary}>{order.summary}</p>
      <p className={styles.orderCardPickup}>
        <Icon name="schedule" className={styles.orderCardPickupIcon} />
        <span className={styles.orderCardPickupText}>
          {formatPickupEtaDisplay(order.estimatedPickupTime, order.acceptedAtMs, pickupMinutes)}
        </span>
      </p>
      <div className={styles.orderCardFoot}>
        <span className={styles.orderCardTime}>{order.time}</span>
        <span className={`${styles.orderCardAmount} ${styles.monoNum}`}>{formatPrice(order.total)}</span>
      </div>
    </button>
  )
}
