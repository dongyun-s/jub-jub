import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ApiError } from '../api/authClient'
import {
  acceptOwnerOrder,
  completeOwnerOrder,
  fetchOwnerOrderDetail,
  fetchOwnerOrders,
  markOwnerOrderReady,
  rejectOwnerOrder,
} from '../api/owner/orders'
import { getOwnerStoreId, useOwnerMockData } from '../lib/ownerConfig'
import type { MockOwnerOrder } from '../lib/mocks/ownerMockData'
import { mapOwnerOrderDetail, mapOwnerOrderSummary } from '../lib/ownerOrderMap'
import { isPickupTimeLocked } from '../lib/ownerPickupTime'
import { readOwnerOrders, resetOwnerOrders, writeOwnerOrders } from '../lib/ownerOrdersStorage'

const POLL_MS = 4_000
const POLL_BACKOFF_MAX_MS = 60_000

function isActive(o: MockOwnerOrder): boolean {
  return o.status === 'progress' || o.status === 'ready'
}

type OwnerOrdersContextValue = {
  orders: MockOwnerOrder[]
  newOrders: MockOwnerOrder[]
  activeOrders: MockOwnerOrder[]
  completedOrders: MockOwnerOrder[]
  useLocalPos: boolean
  useMock: boolean
  loading: boolean
  error: string | null
  refreshOrders: () => Promise<void>
  handleStartCooking: (id: number) => Promise<void>
  handlePickupMinutesChange: (id: number, adjustMinutes: number) => void
  handleCookDone: (id: number) => Promise<void>
  handlePickupDone: (id: number) => Promise<void>
  /** reason 필수(API). mock에서는 무시 가능 */
  rejectOrder: (id: number, reason?: string) => Promise<void>
  simulateIncomingOrder: () => void
  resetDemoOrders: () => void
  loadOrderDetail: (id: number) => Promise<void>
}

const OwnerOrdersContext = createContext<OwnerOrdersContextValue | null>(null)

export function OwnerOrdersProvider({ children }: { children: ReactNode }) {
  const storeId = getOwnerStoreId()
  const useMock = useOwnerMockData()
  const useLocalPos = useMock

  const [orders, setOrders] = useState<MockOwnerOrder[]>(() => (useMock ? readOwnerOrders(storeId) : []))
  const [loading, setLoading] = useState(!useMock)
  const [error, setError] = useState<string | null>(null)
  const detailCache = useRef<Set<number>>(new Set())
  const failStreak = useRef(0)
  const nextPollAt = useRef(0)

  useEffect(() => {
    if (useMock) setOrders(readOwnerOrders(storeId))
  }, [storeId, useMock])

  useEffect(() => {
    if (useMock) writeOwnerOrders(storeId, orders)
  }, [storeId, orders, useMock])

  const refreshOrders = useCallback(async () => {
    if (useMock) return
    if (Date.now() < nextPollAt.current) return
    try {
      const list = await fetchOwnerOrders()
      const mapped = list.map(mapOwnerOrderSummary).filter(Boolean) as MockOwnerOrder[]
      setOrders((prev) => {
        const prevById = new Map(prev.map((o) => [o.orderId, o]))
        return mapped.map((o) => {
          const old = prevById.get(o.orderId)
          if (old && detailCache.current.has(o.orderId) && old.items?.length) {
            return {
              ...o,
              items: old.items,
              customerNote: old.customerNote,
              subtotal: old.subtotal,
              discount: old.discount,
              total: old.total,
              summary: old.summary || o.summary,
            }
          }
          return o
        })
      })
      setError(null)
      failStreak.current = 0
      nextPollAt.current = 0
    } catch (e) {
      failStreak.current += 1
      const backoff = Math.min(POLL_MS * 2 ** Math.min(failStreak.current, 4), POLL_BACKOFF_MAX_MS)
      nextPollAt.current = Date.now() + backoff

      const status = e instanceof ApiError ? e.status : 0
      const raw = e instanceof ApiError ? e.message : e instanceof Error ? e.message : '주문 목록을 불러오지 못했습니다.'
      const msg =
        status >= 500
          ? `서버 오류(${status}): 주문 API가 실패했습니다. 백엔드 로그를 확인해 주세요. (${raw})`
          : raw
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [useMock])

  useEffect(() => {
    if (useMock) {
      setLoading(false)
      return
    }
    void refreshOrders()
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refreshOrders()
    }, POLL_MS)
    const onVis = () => {
      if (document.visibilityState === 'visible') void refreshOrders()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [useMock, refreshOrders])

  const loadOrderDetail = useCallback(
    async (id: number) => {
      if (useMock) return
      try {
        const detail = await fetchOwnerOrderDetail(id)
        const mapped = mapOwnerOrderDetail(detail)
        if (!mapped) return
        detailCache.current.add(id)
        setOrders((prev) => {
          const idx = prev.findIndex((o) => o.orderId === id)
          if (idx < 0) return [...prev, mapped]
          const next = [...prev]
          next[idx] = mapOwnerOrderDetail(detail, prev[idx]) ?? mapped
          return next
        })
      } catch {
        /* 목록만으로도 동작 */
      }
    },
    [useMock],
  )

  const { newOrders, activeOrders, completedOrders } = useMemo(() => {
    const next = {
      newOrders: [] as MockOwnerOrder[],
      activeOrders: [] as MockOwnerOrder[],
      completedOrders: [] as MockOwnerOrder[],
    }
    for (const o of orders) {
      if (o.status === 'new') next.newOrders.push(o)
      else if (isActive(o)) next.activeOrders.push(o)
      else if (o.status === 'completed') next.completedOrders.push(o)
    }
    return next
  }, [orders])

  const handleStartCooking = useCallback(
    async (id: number) => {
      if (useMock) {
        setOrders((prev) =>
          prev.map((o) => {
            if (o.orderId !== id || o.status !== 'new') return o
            return {
              ...o,
              status: 'progress' as const,
              label: '조리 중',
              acceptedAtMs: Date.now(),
              time: '방금 수락',
            }
          }),
        )
        return
      }
      await acceptOwnerOrder(id)
      await refreshOrders()
      await loadOrderDetail(id)
    },
    [useMock, refreshOrders, loadOrderDetail],
  )

  const handlePickupMinutesChange = useCallback(
    (id: number, adjustMinutes: number) => {
      if (!useMock) return
      setOrders((prev) =>
        prev.map((o) => {
          if (o.orderId !== id || isPickupTimeLocked(o)) return o
          return { ...o, pickupAdjustMinutes: adjustMinutes }
        }),
      )
    },
    [useMock],
  )

  const handleCookDone = useCallback(
    async (id: number) => {
      if (useMock) {
        setOrders((prev) =>
          prev.map((o) =>
            o.orderId === id
              ? {
                  ...o,
                  status: 'ready' as const,
                  label: '픽업 대기',
                  readyAtMs: Date.now(),
                  time: '픽업 대기',
                }
              : o,
          ),
        )
        return
      }
      await markOwnerOrderReady(id)
      await refreshOrders()
    },
    [useMock, refreshOrders],
  )

  const handlePickupDone = useCallback(
    async (id: number) => {
      if (useMock) {
        setOrders((prev) =>
          prev.map((o) =>
            o.orderId === id
              ? {
                  ...o,
                  status: 'completed' as const,
                  label: '완료',
                  completedAtMs: Date.now(),
                  time: '방금 완료',
                  orderedAtLabel: '픽업 완료',
                }
              : o,
          ),
        )
        return
      }
      await completeOwnerOrder(id)
      await refreshOrders()
    },
    [useMock, refreshOrders],
  )

  const rejectOrder = useCallback(
    async (id: number, reason = '주문을 받을 수 없습니다.') => {
      if (useMock) {
        setOrders((prev) =>
          prev.map((o) =>
            o.orderId === id
              ? {
                  ...o,
                  status: 'completed' as const,
                  rejected: true,
                  label: '거절',
                  time: '방금 거절',
                  orderedAtLabel: '거절됨',
                  paymentMethod: '거절·환불',
                  completedAtMs: Date.now(),
                  customerNote: [o.customerNote, reason].filter(Boolean).join(' · '),
                }
              : o,
          ),
        )
        return
      }
      await rejectOwnerOrder(id, reason.trim() || '주문을 받을 수 없습니다.')
      detailCache.current.delete(id)
      await refreshOrders()
    },
    [useMock, refreshOrders],
  )

  const simulateIncomingOrder = useCallback(() => {
    if (!useMock) return
    const id = Date.now()
    const order: MockOwnerOrder = {
      orderId: id,
      orderNo: `${String(id).slice(-4)}-N`,
      label: '신규',
      summary: '테스트 주문 · 불고기 비빔밥',
      amount: 14000,
      time: '방금 전',
      status: 'new',
      orderedAtLabel: '방금 픽업 주문',
      items: [{ name: '시그니처 불고기 비빔밥', option: '곱빼기', price: 14000 }],
      customerNote: '수저 빼 주세요.',
      subtotal: 14000,
      discount: 0,
      total: 14000,
      paymentMethod: '테스트 결제',
    }
    setOrders((prev) => [order, ...prev])
  }, [useMock])

  const resetDemoOrders = useCallback(() => {
    if (!useMock) return
    setOrders(resetOwnerOrders(storeId))
  }, [storeId, useMock])

  const value = useMemo(
    () => ({
      orders,
      newOrders,
      activeOrders,
      completedOrders,
      useLocalPos,
      useMock,
      loading,
      error,
      refreshOrders,
      handleStartCooking,
      handlePickupMinutesChange,
      handleCookDone,
      handlePickupDone,
      rejectOrder,
      simulateIncomingOrder,
      resetDemoOrders,
      loadOrderDetail,
    }),
    [
      orders,
      newOrders,
      activeOrders,
      completedOrders,
      useLocalPos,
      useMock,
      loading,
      error,
      refreshOrders,
      handleStartCooking,
      handlePickupMinutesChange,
      handleCookDone,
      handlePickupDone,
      rejectOrder,
      simulateIncomingOrder,
      resetDemoOrders,
      loadOrderDetail,
    ],
  )

  return <OwnerOrdersContext.Provider value={value}>{children}</OwnerOrdersContext.Provider>
}

export function useOwnerOrders() {
  const ctx = useContext(OwnerOrdersContext)
  if (!ctx) {
    throw new Error('useOwnerOrders must be used within OwnerOrdersProvider')
  }
  return ctx
}
