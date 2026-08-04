import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getOwnerStoreId } from '../lib/ownerConfig'
import type { MockOwnerOrder } from '../lib/mocks/ownerMockData'
import { isPickupTimeLocked } from '../lib/ownerPickupTime'
import { readOwnerOrders, resetOwnerOrders, writeOwnerOrders } from '../lib/ownerOrdersStorage'

function isActive(o: MockOwnerOrder): boolean {
  return o.status === 'progress' || o.status === 'ready'
}

type OwnerOrdersContextValue = {
  orders: MockOwnerOrder[]
  newOrders: MockOwnerOrder[]
  activeOrders: MockOwnerOrder[]
  completedOrders: MockOwnerOrder[]
  /** 항상 로컬 POS (프론트 전용) */
  useLocalPos: boolean
  /** @deprecated useLocalPos 와 동일 — 기존 호출부 호환 */
  useMock: boolean
  handleStartCooking: (id: number) => void
  handlePickupMinutesChange: (id: number, adjustMinutes: number) => void
  handleCookDone: (id: number) => void
  handlePickupDone: (id: number) => void
  rejectOrder: (id: number) => void
  /** 예시·테스트: 신규 주문 1건 추가 */
  simulateIncomingOrder: () => void
  /** 예시 데이터로 보드 초기화 */
  resetDemoOrders: () => void
}

const OwnerOrdersContext = createContext<OwnerOrdersContextValue | null>(null)

export function OwnerOrdersProvider({ children }: { children: ReactNode }) {
  const storeId = getOwnerStoreId()
  const [orders, setOrders] = useState<MockOwnerOrder[]>(() => readOwnerOrders(storeId))

  useEffect(() => {
    setOrders(readOwnerOrders(storeId))
  }, [storeId])

  useEffect(() => {
    writeOwnerOrders(storeId, orders)
  }, [storeId, orders])

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

  const handleStartCooking = useCallback((id: number) => {
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
  }, [])

  const handlePickupMinutesChange = useCallback((id: number, adjustMinutes: number) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.orderId !== id || isPickupTimeLocked(o)) return o
        return { ...o, pickupAdjustMinutes: adjustMinutes }
      }),
    )
  }, [])

  const handleCookDone = useCallback((id: number) => {
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
  }, [])

  const handlePickupDone = useCallback((id: number) => {
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
  }, [])

  const rejectOrder = useCallback((id: number) => {
    setOrders((prev) => prev.filter((o) => o.orderId !== id))
  }, [])

  const simulateIncomingOrder = useCallback(() => {
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
      items: [
        { name: '시그니처 불고기 비빔밥', option: '곱빼기', price: 14000 },
      ],
      customerNote: '수저 빼 주세요.',
      subtotal: 14000,
      discount: 0,
      total: 14000,
      paymentMethod: '테스트 결제',
    }
    setOrders((prev) => [order, ...prev])
  }, [])

  const resetDemoOrders = useCallback(() => {
    setOrders(resetOwnerOrders(storeId))
  }, [storeId])

  const value = useMemo(
    () => ({
      orders,
      newOrders,
      activeOrders,
      completedOrders,
      useLocalPos: true,
      useMock: true,
      handleStartCooking,
      handlePickupMinutesChange,
      handleCookDone,
      handlePickupDone,
      rejectOrder,
      simulateIncomingOrder,
      resetDemoOrders,
    }),
    [
      orders,
      newOrders,
      activeOrders,
      completedOrders,
      handleStartCooking,
      handlePickupMinutesChange,
      handleCookDone,
      handlePickupDone,
      rejectOrder,
      simulateIncomingOrder,
      resetDemoOrders,
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
