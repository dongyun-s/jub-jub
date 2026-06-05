import { Icon } from '../../components/Icon'
import { formatPrice } from '../../lib/format'
import { formatPickupEtaLabel, formatPickupPreviewLabel, resolvePickupMinutes } from '../../lib/ownerPickupTime'
import type { MockOwnerOrder } from '../../lib/mocks/ownerMockData'
import styles from './OrdersPage.module.css'

type OrderCardBaseProps = {
  order: MockOwnerOrder
  baseMinutes: number
  selected: boolean
  onSelect: (id: number) => void
  shouldIgnoreClick?: () => boolean
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
}: OrderCardBaseProps) {
  const pickupMinutes = resolvePickupMinutes(baseMinutes, order.pickupAdjustMinutes ?? 0)

  return (
    <button
      type="button"
      className={[styles.orderCardBtn, styles.orderCardNew, selected ? styles.orderCardSelected : '']
        .filter(Boolean)
        .join(' ')}
      aria-label={`신규 주문 ${order.orderNo}`}
      aria-pressed={selected}
      onClick={() => guardSelect(shouldIgnoreClick, order.orderId, onSelect)}
    >
      <div className={styles.orderCardTop}>
        <span className={`${styles.orderCardNo} ${styles.monoNum}`}>#{order.orderNo}</span>
        <span className={styles.badgeNew}>신규</span>
      </div>
      <p className={styles.orderCardSummary}>{order.summary}</p>
      <p className={styles.orderCardPickup}>{formatPickupPreviewLabel(pickupMinutes)}</p>
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
      aria-pressed={selected}
      onClick={() => onSelect(order.orderId)}
    >
      <div className={styles.orderCardTop}>
        <span className={`${styles.orderCardNo} ${styles.monoNum}`}>#{order.orderNo}</span>
        <span className={isReady ? styles.badgeReady : styles.badgeCooking}>
          {isReady ? '픽업 대기' : '조리 중'}
        </span>
      </div>
      <p className={styles.orderCardSummary}>{order.summary}</p>
      <p className={styles.orderCardPickup}>
        <Icon name="schedule" style={{ fontSize: '0.875rem', verticalAlign: 'middle' }} />{' '}
        {formatPickupEtaLabel(order.acceptedAtMs, pickupMinutes)}
      </p>
      <div className={styles.orderCardFoot}>
        <span className={styles.orderCardTime}>{order.time}</span>
        <span className={`${styles.orderCardAmount} ${styles.monoNum}`}>{formatPrice(order.total)}</span>
      </div>
    </button>
  )
}
