import { useCallback, useEffect, useState } from 'react'
import { fetchStoreGeo, type StoreGeo } from '../lib/storeGeo'
import {
  getActivePaidOrderFromLocal,
  resolveActivePaidOrder,
  resolveOrderById,
  type OrderContextRow,
} from '../lib/orderResolve'

export type PickupDestination = StoreGeo

function isPickupPending(o: OrderContextRow): boolean {
  if (o.pickupCompleted || o.orderStatus === 'COMPLETED') return false
  if (o.orderStatus === 'PAID') return true
  return o.paymentStatus === 'PAID'
}

export function useActivePickup(focusOrderId?: number | null) {
  const [activeOrder, setActiveOrder] = useState<OrderContextRow | null>(null)
  const [destination, setDestination] = useState<PickupDestination | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const order =
        focusOrderId != null && focusOrderId > 0
          ? await resolveOrderById(focusOrderId)
          : await resolveActivePaidOrder()

      setActiveOrder(order)

      if (!order?.storeId) {
        setDestination(null)
        return
      }

      const geo = await fetchStoreGeo(order.storeId)
      if (geo) {
        setDestination({
          ...geo,
          name: order.storeName?.trim() || geo.name,
        })
      } else {
        setDestination(null)
      }
    } catch {
      setActiveOrder(getActivePaidOrderFromLocal())
      setDestination(null)
    } finally {
      setLoading(false)
    }
  }, [focusOrderId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const hasActivePickup = activeOrder != null && isPickupPending(activeOrder)

  return {
    activeOrder,
    destination,
    hasActivePickup,
    loading,
    refresh,
  }
}
