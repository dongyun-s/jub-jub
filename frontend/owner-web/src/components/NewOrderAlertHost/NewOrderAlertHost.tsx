import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmModal from '../ConfirmModal/ConfirmModal'
import { useOwnerOrders } from '../../context/OwnerOrdersProvider'
import { useOwnerStoreDetail } from '../../hooks/useOwnerStoreDetail'
import { useOwnerCookingTime } from '../../hooks/useOwnerCookingTime'
import { useNewOrderAlerts } from '../../hooks/useNewOrderAlerts'
import {
  canUseDesktopNotification,
  focusOwnerWindow,
  requestDesktopNotificationPermission,
  stopFlashPageTitle,
} from '../../lib/ownerNewOrderAlert'
import { NewOrderAlertModal } from '../NewOrderAlertModal/NewOrderAlertModal'

export function NewOrderAlertHost() {
  const navigate = useNavigate()
  const { storeId, store } = useOwnerStoreDetail()
  const { baseMinutes } = useOwnerCookingTime(storeId, store?.cookingTimeMinutes)
  const {
    newOrders,
    handleStartCooking,
    handlePickupMinutesChange,
    rejectOrder,
  } = useOwnerOrders()

  const [notifyHint, setNotifyHint] = useState(
    () => canUseDesktopNotification() && Notification.permission === 'default',
  )
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null)

  const handleActivate = useCallback(
    (order: { orderId: number }) => {
      focusOwnerWindow()
      navigate('/orders', { state: { selectOrderId: order.orderId } })
    },
    [navigate],
  )

  const { incomingOrder, dismiss } = useNewOrderAlerts(newOrders, handleActivate)

  const alertOrder = useMemo(() => {
    if (!incomingOrder) return null
    return newOrders.find((o) => o.orderId === incomingOrder.orderId) ?? incomingOrder
  }, [incomingOrder, newOrders])

  const handleStartFromModal = (id: number) => {
    void handleStartCooking(id)
    dismiss()
    stopFlashPageTitle()
    handleActivate({ orderId: id })
  }

  /** 나중에: 모달만 닫지 않고 주문 화면에서 해당 건 선택 → 우측 메뉴·결제 내역 표시 */
  const handleDefer = () => {
    const id = alertOrder?.orderId
    dismiss()
    stopFlashPageTitle()
    if (id != null) handleActivate({ orderId: id })
  }

  const confirmReject = () => {
    if (rejectTargetId == null) return
    const id = rejectTargetId
    setRejectTargetId(null)
    void rejectOrder(id, '재료 소진 등으로 주문을 받을 수 없습니다.')
    dismiss()
    stopFlashPageTitle()
  }

  const handleEnableNotify = async () => {
    const result = await requestDesktopNotificationPermission()
    if (result === 'granted' || result === 'denied') setNotifyHint(false)
  }

  return (
    <>
      <NewOrderAlertModal
        open={alertOrder != null}
        order={alertOrder}
        baseMinutes={baseMinutes}
        onPickupMinutesChange={handlePickupMinutesChange}
        onStartCooking={handleStartFromModal}
        onReject={setRejectTargetId}
        onClose={handleDefer}
        onEnableNotify={handleEnableNotify}
        showNotifyHint={notifyHint}
      />

      <ConfirmModal
        open={rejectTargetId != null}
        title="주문 거절"
        message="이 주문을 거절할까요? 고객에게 취소 안내가 필요합니다."
        confirmLabel="거절"
        confirmTone="danger"
        onCancel={() => setRejectTargetId(null)}
        onConfirm={confirmReject}
      />
    </>
  )
}
