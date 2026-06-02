import { useId, useMemo } from 'react'
import AppModal from '../AppModal/AppModal'
import { Icon } from '../Icon'
import { PickupTimeStepper } from '../PickupTimeStepper/PickupTimeStepper'
import { formatPrice } from '../../lib/format'
import { formatPickupPreviewLabel, resolvePickupMinutes } from '../../lib/ownerPickupTime'
import type { MockOwnerOrder } from '../../lib/mocks/ownerMockData'
import mc from '../AppModal/modalContent.module.css'
import styles from './NewOrderAlertModal.module.css'

type NewOrderAlertModalProps = {
  open: boolean
  order: MockOwnerOrder | null
  baseMinutes: number
  onPickupMinutesChange: (id: number, adjustMinutes: number) => void
  onStartCooking: (id: number) => void
  onReject: (id: number) => void
  onClose: () => void
  onEnableNotify?: () => void
  showNotifyHint?: boolean
}

export function NewOrderAlertModal({
  open,
  order,
  baseMinutes,
  onPickupMinutesChange,
  onStartCooking,
  onReject,
  onClose,
  onEnableNotify,
  showNotifyHint,
}: NewOrderAlertModalProps) {
  const titleId = useId()
  const descId = useId()

  const liveOrder = order

  const pickupMinutes = useMemo(
    () => (liveOrder ? resolvePickupMinutes(baseMinutes, liveOrder.pickupAdjustMinutes ?? 0) : baseMinutes),
    [liveOrder, baseMinutes],
  )

  const adjustHint = useMemo(() => {
    if (!liveOrder) return ''
    const adjust = liveOrder.pickupAdjustMinutes ?? 0
    if (adjust === 0) return '매장 기본과 동일 · 조리 시작 시 확정'
    return `기본 대비 ${adjust > 0 ? '+' : ''}${adjust}분`
  }, [liveOrder])

  if (!liveOrder) return null

  return (
    <AppModal
      open={open}
      onClose={onClose}
      size="lg"
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descId}
      closeOnBackdrop={false}
    >
      <div className={styles.wrap}>
        <div className={mc.iconWrapLarge}>
          <span className={`material-symbols-outlined ${mc.icon} ${mc.iconFill} ${mc.iconLarge}`}>
            notifications_active
          </span>
        </div>
        <h2 id={titleId} className={mc.titleCenter}>
          신규 주문이 들어왔습니다
        </h2>
        <p id={descId} className={styles.orderNo}>
          #{liveOrder.orderNo}
        </p>
        <p className={styles.summary}>{liveOrder.summary}</p>
        <p className={styles.amount}>{formatPrice(liveOrder.total)}</p>

        {liveOrder.customerNote ? (
          <p className={styles.note}>{liveOrder.customerNote}</p>
        ) : null}

        <div className={styles.pickupBlock}>
          <p className={styles.pickupLead}>{formatPickupPreviewLabel(pickupMinutes)}</p>
          <PickupTimeStepper
            compact
            label="픽업 시간 설정"
            hint={adjustHint}
            minutes={pickupMinutes}
            onChange={(next) => onPickupMinutesChange(liveOrder.orderId, next - baseMinutes)}
          />
        </div>

        {showNotifyHint && onEnableNotify ? (
          <p className={styles.notifyHint}>
            다른 앱 사용 중에는{' '}
            <button type="button" className={styles.notifyLink} onClick={onEnableNotify}>
              브라우저 알림 허용
            </button>
            을 권장합니다.
          </p>
        ) : null}

        <button
          type="button"
          className={styles.btnStart}
          onClick={() => onStartCooking(liveOrder.orderId)}
        >
          <Icon name="skillet" />
          조리 시작
        </button>

        <div className={styles.actions}>
          <button type="button" className={styles.btnReject} onClick={() => onReject(liveOrder.orderId)}>
            거절
          </button>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            나중에
          </button>
        </div>
      </div>
    </AppModal>
  )
}
