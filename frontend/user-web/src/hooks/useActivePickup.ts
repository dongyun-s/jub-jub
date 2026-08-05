import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchOrderTracking,
  isAcceptedTracking,
  isPickupCompletedTracking,
  isRejectedTracking,
  isWaitingAcceptTracking,
  type OrderTrackingStatus,
} from '../api/orderTracking'
import { getAccessToken } from '../lib/authStorage'
import { fetchStoreGeo, type StoreGeo } from '../lib/storeGeo'
import {
  resolveActivePaidOrder,
  resolveOrderById,
  type OrderContextRow,
} from '../lib/orderResolve'

export type PickupDestination = StoreGeo

/** waiting: 수락 전 / accepted: 수락 후(현황·경로) / rejected: 거절 감지 */
export type PickupPhase = 'waiting' | 'accepted' | 'rejected' | null

export type OrderRejectNotice = {
  orderId: number
  reason: string
}

const TRACKING_POLL_MS = 8_000
const LOCAL_ORDERS_KEY = '__jubjub_local_orders'

function isPickupPending(o: OrderContextRow): boolean {
  if (o.pickupCompleted || o.orderStatus === 'COMPLETED' || o.orderStatus === 'REFUNDED') return false
  if (o.orderStatus === 'PAID') return true
  return o.paymentStatus === 'PAID'
}

function markLocalOrderRejected(orderId: number) {
  try {
    const raw = window.localStorage.getItem(LOCAL_ORDERS_KEY)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    const prev = Array.isArray(arr) ? (arr as OrderContextRow[]) : []
    const next = prev.map((o) =>
      o.orderId === orderId ? { ...o, pickupCompleted: true, orderStatus: 'REFUNDED' } : o,
    )
    window.localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(next))
    window.dispatchEvent(new Event('jubjub:orders-updated'))
  } catch {
    /* ignore */
  }
}

function markLocalOrderPickupCompleted(orderId: number) {
  try {
    const raw = window.localStorage.getItem(LOCAL_ORDERS_KEY)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    const prev = Array.isArray(arr) ? (arr as OrderContextRow[]) : []
    const next = prev.map((o) =>
      o.orderId === orderId ? { ...o, pickupCompleted: true, orderStatus: 'COMPLETED' } : o,
    )
    window.localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(next))
    window.dispatchEvent(new Event('jubjub:orders-updated'))
  } catch {
    /* ignore */
  }
}

function phaseFromTracking(
  tracking: OrderTrackingStatus | null | undefined,
  paymentOrderStatus?: string | null,
): PickupPhase {
  if (isRejectedTracking(tracking, paymentOrderStatus)) return 'rejected'
  if (isPickupCompletedTracking(tracking, paymentOrderStatus)) return null
  if (isAcceptedTracking(tracking)) return 'accepted'
  if (isWaitingAcceptTracking(tracking, paymentOrderStatus)) return 'waiting'
  return null
}

export function useActivePickup(focusOrderId?: number | null) {
  const [activeOrder, setActiveOrder] = useState<OrderContextRow | null>(null)
  const [destination, setDestination] = useState<PickupDestination | null>(null)
  const [loading, setLoading] = useState(true)
  const [pickupPhase, setPickupPhase] = useState<PickupPhase>(null)
  const [rejectNotice, setRejectNotice] = useState<OrderRejectNotice | null>(null)
  const notifiedRejectIds = useRef<Set<number>>(new Set())

  const applyReject = useCallback((orderId: number, reason?: string | null) => {
    markLocalOrderRejected(orderId)
    if (notifiedRejectIds.current.has(orderId)) return
    notifiedRejectIds.current.add(orderId)
    setRejectNotice({
      orderId,
      reason:
        reason?.trim() ||
        '매장 사정으로 주문을 받을 수 없습니다. 결제는 환불 처리됩니다.',
    })
    setPickupPhase('rejected')
    setActiveOrder(null)
    setDestination(null)
  }, [])

  const dismissRejectNotice = useCallback(() => {
    setRejectNotice(null)
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const order =
        focusOrderId != null && focusOrderId > 0
          ? await resolveOrderById(focusOrderId)
          : await resolveActivePaidOrder()

      if (!order) {
        setActiveOrder(null)
        setDestination(null)
        setPickupPhase(null)
        return
      }

      if (order.orderStatus === 'REFUNDED') {
        applyReject(order.orderId)
        return
      }

      let tracking: OrderTrackingStatus | null = null
      let paymentOrderStatus: string | null = order.orderStatus ?? null
      let rejectReason: string | null = null
      let trackingOverride: {
        lat?: number | null
        lng?: number | null
        address?: string | null
        name?: string | null
      } | null = null

      if (getAccessToken() && order.orderId > 0) {
        try {
          const data = await fetchOrderTracking(order.orderId)
          tracking = data.trackingStatus
          paymentOrderStatus = data.paymentOrderStatus ?? paymentOrderStatus
          rejectReason = data.rejectReason ?? null
          trackingOverride = {
            lat: data.storeLatitude,
            lng: data.storeLongitude,
            address: data.storeAddress,
            name: data.storeName,
          }
        } catch {
          /* 목록·상세 좌표로 폴백 — 추적 실패 시 수락 대기로 둠 */
          tracking = null
        }
      }

      const phase = phaseFromTracking(tracking, paymentOrderStatus)
      if (phase === 'rejected') {
        applyReject(order.orderId, rejectReason)
        return
      }

      // 픽업 완료 → 현황·경로 배너/목적지 종료
      if (phase == null && isPickupCompletedTracking(tracking, paymentOrderStatus)) {
        markLocalOrderPickupCompleted(order.orderId)
        setPickupPhase(null)
        setActiveOrder(null)
        setDestination(null)
        return
      }

      if (order.pickupCompleted || order.orderStatus === 'COMPLETED') {
        setPickupPhase(null)
        setActiveOrder(null)
        setDestination(null)
        return
      }

      setPickupPhase(phase)
      setActiveOrder(order)

      // 수락 전에는 경로용 목적지 좌표를 올리지 않음
      if (phase !== 'accepted' || !order.storeId) {
        setDestination(null)
        return
      }

      const geo = await fetchStoreGeo(order.storeId, trackingOverride)
      if (geo) {
        setDestination({
          ...geo,
          name: order.storeName?.trim() || geo.name,
        })
      } else {
        setDestination(null)
      }
    } catch {
      setActiveOrder(null)
      setDestination(null)
      setPickupPhase(null)
    } finally {
      setLoading(false)
    }
  }, [focusOrderId, applyReject])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // 수락 대기·진행 중일 때 추적 폴링 (거절/수락 감지)
  useEffect(() => {
    if (!getAccessToken()) return
    if (pickupPhase !== 'waiting' && pickupPhase !== 'accepted') return
    if (!activeOrder?.orderId) return

    const orderId = activeOrder.orderId
    let cancelled = false

    const poll = async () => {
      if (cancelled) return
      try {
        const data = await fetchOrderTracking(orderId)
        if (cancelled) return
        const phase = phaseFromTracking(data.trackingStatus, data.paymentOrderStatus)
        if (phase === 'rejected') {
          applyReject(orderId, data.rejectReason)
          return
        }
        if (phase == null || phase !== pickupPhase) {
          void refresh()
        }
      } catch {
        /* 다음 폴링에서 재시도 */
      }
    }

    const intervalId = window.setInterval(() => void poll(), TRACKING_POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [pickupPhase, activeOrder?.orderId, applyReject, refresh])

  const hasActivePickup = pickupPhase === 'accepted' && activeOrder != null && isPickupPending(activeOrder)
  const hasWaitingAccept = pickupPhase === 'waiting' && activeOrder != null && isPickupPending(activeOrder)

  return {
    activeOrder,
    destination,
    hasActivePickup,
    hasWaitingAccept,
    pickupPhase,
    rejectNotice,
    dismissRejectNotice,
    loading,
    refresh,
  }
}
