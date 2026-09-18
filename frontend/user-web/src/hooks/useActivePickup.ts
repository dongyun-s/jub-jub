import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchDepartureRecommendation,
  fetchOrderTracking,
  isAcceptedTracking,
  isPickupCompletedTracking,
  isRejectedTracking,
  isWaitingAcceptTracking,
  type DepartureRecommendationResponse,
  type OrderTrackingStatus,
} from '../api/orderTracking'
import { getAccessToken } from '../lib/authStorage'
import { getUserCoords } from '../lib/geolocation'
import { fetchStoreGeo, type StoreGeo } from '../lib/storeGeo'
import {
  getActivePaidOrdersFromLocal,
  resolveAllActivePaidOrders,
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

/** 진행·대기 중인 주문 카드용 */
export type TrackablePickup = {
  order: OrderContextRow
  phase: 'waiting' | 'accepted'
  estimatedPickupTime: string | null
}

const TRACKING_POLL_MS = 8_000
const DEPARTURE_POLL_MS = 30_000
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

/** 픽업 완료 감지(홈 등 주문현황 밖) → 리워드 갱신 트리거 */
function emitPickupCompleted(order: OrderContextRow) {
  try {
    window.dispatchEvent(
      new CustomEvent('jubjub:pickup-completed', {
        detail: {
          orderId: order.orderId,
          storeId: order.storeId,
          storeName: order.storeName?.trim() || '매장',
        },
      }),
    )
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

async function enrichTrackable(order: OrderContextRow): Promise<{
  trackable: TrackablePickup | null
  rejected?: { orderId: number; reason: string | null }
  completed?: boolean
  trackingOverride?: {
    lat?: number | null
    lng?: number | null
    address?: string | null
    name?: string | null
  } | null
}> {
  if (order.orderStatus === 'REFUNDED') {
    return { trackable: null, rejected: { orderId: order.orderId, reason: null } }
  }
  if (order.pickupCompleted || order.orderStatus === 'COMPLETED') {
    return { trackable: null, completed: true }
  }

  let tracking: OrderTrackingStatus | null = null
  let paymentOrderStatus: string | null = order.orderStatus ?? null
  let rejectReason: string | null = null
  let nextEta: string | null = null
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
      nextEta = data.estimatedPickupTime ?? null
      trackingOverride = {
        lat: data.storeLatitude,
        lng: data.storeLongitude,
        address: data.storeAddress,
        name: data.storeName,
      }
    } catch {
      tracking = null
    }
  }

  const phase = phaseFromTracking(tracking, paymentOrderStatus)
  if (phase === 'rejected') {
    return { trackable: null, rejected: { orderId: order.orderId, reason: rejectReason } }
  }
  if (phase == null && isPickupCompletedTracking(tracking, paymentOrderStatus)) {
    return { trackable: null, completed: true }
  }
  if (phase !== 'waiting' && phase !== 'accepted') {
    return { trackable: null }
  }
  if (!isPickupPending(order)) {
    return { trackable: null }
  }

  return {
    trackable: {
      order,
      phase,
      estimatedPickupTime: nextEta,
    },
    trackingOverride,
  }
}

function pickPrimary(trackables: TrackablePickup[], focusOrderId?: number | null): TrackablePickup | null {
  if (trackables.length === 0) return null
  // focus가 있으면 그 주문만 — 없으면 다른 주문으로 넘기지 않음(완료 직후 화면 점프 방지)
  if (focusOrderId != null && focusOrderId > 0) {
    return trackables.find((t) => t.order.orderId === focusOrderId) ?? null
  }
  return trackables.find((t) => t.phase === 'accepted') ?? trackables[0] ?? null
}

export function useActivePickup(focusOrderId?: number | null) {
  const [activeOrder, setActiveOrder] = useState<OrderContextRow | null>(null)
  const [trackableOrders, setTrackableOrders] = useState<TrackablePickup[]>([])
  const [destination, setDestination] = useState<PickupDestination | null>(null)
  const [loading, setLoading] = useState(true)
  const [pickupPhase, setPickupPhase] = useState<PickupPhase>(null)
  const [estimatedPickupTime, setEstimatedPickupTime] = useState<string | null>(null)
  const [departureRecommendation, setDepartureRecommendation] =
    useState<DepartureRecommendationResponse | null>(null)
  const [rejectNotice, setRejectNotice] = useState<OrderRejectNotice | null>(null)
  const notifiedRejectIds = useRef<Set<number>>(new Set())
  const trackableIdsRef = useRef<number[]>([])

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
  }, [])

  const dismissRejectNotice = useCallback(() => {
    setRejectNotice(null)
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      let candidates: OrderContextRow[] = []
      if (focusOrderId != null && focusOrderId > 0) {
        const focused = await resolveOrderById(focusOrderId)
        const all = await resolveAllActivePaidOrders()
        const merged = new Map<number, OrderContextRow>()
        for (const o of all) merged.set(o.orderId, o)
        if (focused) merged.set(focused.orderId, focused)
        candidates = [...merged.values()].sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return tb - ta
        })
      } else {
        candidates = await resolveAllActivePaidOrders()
      }

      const results = await Promise.all(candidates.map((o) => enrichTrackable(o)))
      const nextTrackables: TrackablePickup[] = []

      for (let i = 0; i < results.length; i++) {
        const r = results[i]!
        const order = candidates[i]!
        if (r.rejected) {
          applyReject(r.rejected.orderId, r.rejected.reason)
          continue
        }
        if (r.completed) {
          markLocalOrderPickupCompleted(order.orderId)
          emitPickupCompleted(order)
          continue
        }
        if (r.trackable) {
          nextTrackables.push(r.trackable)
        }
      }

      setTrackableOrders(nextTrackables)
      trackableIdsRef.current = nextTrackables.map((t) => t.order.orderId)

      const primary = pickPrimary(nextTrackables, focusOrderId)

      // focus 주문이 완료·거절되어 trackable에서 빠졌을 때 → 다른 주문으로 전환하지 않고 해당 주문 유지
      if (!primary && focusOrderId != null && focusOrderId > 0) {
        const focusedRow =
          candidates.find((c) => c.orderId === focusOrderId) ??
          (await resolveOrderById(focusOrderId))
        if (focusedRow) {
          const focusedResult = results.find(
            (_, idx) => candidates[idx]?.orderId === focusOrderId,
          )
          setActiveOrder(focusedRow)
          if (focusedResult?.rejected || focusedRow.orderStatus === 'REFUNDED') {
            setPickupPhase('rejected')
          } else {
            setPickupPhase(null)
          }
          setEstimatedPickupTime(null)
          setDepartureRecommendation(null)
          setDestination(null)
          return
        }
      }

      if (!primary) {
        setActiveOrder(null)
        setDestination(null)
        setPickupPhase(null)
        setEstimatedPickupTime(null)
        setDepartureRecommendation(null)
        return
      }

      const primaryResult = results.find(
        (r, idx) =>
          r.trackable?.order.orderId === primary.order.orderId ||
          candidates[idx]?.orderId === primary.order.orderId,
      )
      const primaryOverride = primaryResult?.trackingOverride ?? null

      setActiveOrder(primary.order)
      setPickupPhase(primary.phase)
      setEstimatedPickupTime(primary.estimatedPickupTime)

      if (primary.phase !== 'accepted' || !primary.order.storeId) {
        setDestination(null)
        return
      }

      try {
        const geo = await fetchStoreGeo(primary.order.storeId, primaryOverride)
        if (geo) {
          setDestination({
            ...geo,
            name: primary.order.storeName?.trim() || geo.name,
          })
        } else {
          setDestination(null)
        }
      } catch {
        setDestination(null)
      }
    } catch {
      // 네트워크 실패 시 진행 중 목록을 비우지 않음 — 로컬 폴백만 시도
      try {
        const localOnly = getActivePaidOrdersFromLocal()
        if (localOnly.length === 0) return
        const results = await Promise.all(localOnly.map((o) => enrichTrackable(o)))
        const nextTrackables: TrackablePickup[] = []
        for (let i = 0; i < results.length; i++) {
          const r = results[i]!
          if (r.trackable) nextTrackables.push(r.trackable)
        }
        if (nextTrackables.length === 0) return
        setTrackableOrders(nextTrackables)
        trackableIdsRef.current = nextTrackables.map((t) => t.order.orderId)
        const primary = pickPrimary(nextTrackables, focusOrderId)
        if (!primary) return
        setActiveOrder(primary.order)
        setPickupPhase(primary.phase)
        setEstimatedPickupTime(primary.estimatedPickupTime)
      } catch {
        /* 이전 UI 유지 */
      }
    } finally {
      setLoading(false)
    }
  }, [focusOrderId, applyReject])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // 대표 주문 출발 추천 (홈 배너용)
  useEffect(() => {
    if (!getAccessToken()) {
      setDepartureRecommendation(null)
      return
    }
    if (!activeOrder?.orderId || pickupPhase !== 'accepted') {
      setDepartureRecommendation(null)
      return
    }

    const orderId = activeOrder.orderId
    let cancelled = false

    const poll = async () => {
      if (cancelled) return
      try {
        const coords = await getUserCoords()
        if (cancelled) return
        const data = await fetchDepartureRecommendation(orderId, coords.latitude, coords.longitude)
        if (cancelled) return
        setDepartureRecommendation(data)
        if (data.estimatedPickupTime) {
          setEstimatedPickupTime(data.estimatedPickupTime)
        }
      } catch {
        if (!cancelled) setDepartureRecommendation(null)
      }
    }

    void poll()
    const intervalId = window.setInterval(() => void poll(), DEPARTURE_POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [activeOrder?.orderId, pickupPhase])

  // 진행·대기 주문 전부 추적 폴링
  useEffect(() => {
    if (!getAccessToken()) return
    if (trackableOrders.length === 0) return

    const ids = trackableOrders.map((t) => t.order.orderId)
    const snapshot = trackableOrders
    let cancelled = false

    const poll = async () => {
      if (cancelled) return
      let needsRefresh = false
      try {
        await Promise.all(
          ids.map(async (orderId) => {
            try {
              const data = await fetchOrderTracking(orderId)
              if (cancelled) return
              const phase = phaseFromTracking(data.trackingStatus, data.paymentOrderStatus)
              if (phase === 'rejected') {
                applyReject(orderId, data.rejectReason)
                needsRefresh = true
                return
              }
              const prev = snapshot.find((t) => t.order.orderId === orderId)
              if (!prev) {
                needsRefresh = true
                return
              }
              if (phase == null || phase !== prev.phase) {
                needsRefresh = true
                return
              }
              const eta = data.estimatedPickupTime ?? null
              if (eta !== prev.estimatedPickupTime) {
                needsRefresh = true
              }
            } catch {
              /* 개별 주문 실패는 다음 폴링 */
            }
          }),
        )
        if (!cancelled && needsRefresh) {
          void refresh()
        }
      } catch {
        /* ignore */
      }
    }

    const intervalId = window.setInterval(() => {
      void poll()
    }, TRACKING_POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [trackableOrders, applyReject, refresh])

  const hasActivePickup = trackableOrders.some((t) => t.phase === 'accepted')
  const hasWaitingAccept = trackableOrders.some((t) => t.phase === 'waiting')
  const hasTrackableOrder = trackableOrders.length > 0

  return {
    activeOrder,
    trackableOrders,
    destination,
    estimatedPickupTime,
    departureRecommendation,
    hasActivePickup,
    hasWaitingAccept,
    hasTrackableOrder,
    pickupPhase,
    rejectNotice,
    dismissRejectNotice,
    loading,
    refresh,
  }
}
