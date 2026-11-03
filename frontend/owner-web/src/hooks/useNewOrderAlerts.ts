import { useEffect, useRef, useState } from 'react'
import type { MockOwnerOrder } from '../lib/mocks/ownerMockData'
import { alertForNewOrder, stopFlashPageTitle } from '../lib/ownerNewOrderAlert'

/**
 * 신규(status=new) 주문 ID가 추가될 때 알림 (초기 로드 제외)
 */
export function useNewOrderAlerts(
  newOrders: MockOwnerOrder[],
  onActivate: (order: MockOwnerOrder) => void,
) {
  const [incomingOrder, setIncomingOrder] = useState<MockOwnerOrder | null>(null)
  const seenIdsRef = useRef<Set<number>>(new Set())
  const bootstrappedRef = useRef(false)

  useEffect(() => {
    const currentIds = new Set(newOrders.map((o) => o.orderId))

    if (!bootstrappedRef.current) {
      bootstrappedRef.current = true
      seenIdsRef.current = currentIds
      return
    }

    const fresh = newOrders.filter((o) => !seenIdsRef.current.has(o.orderId))
    seenIdsRef.current = currentIds

    if (fresh.length === 0) return

    const latest = fresh[fresh.length - 1]
    setIncomingOrder(latest)
    alertForNewOrder(latest, () => onActivate(latest))
  }, [newOrders, onActivate])

  const dismiss = () => {
    setIncomingOrder(null)
    stopFlashPageTitle()
  }

  return { incomingOrder, dismiss }
}
