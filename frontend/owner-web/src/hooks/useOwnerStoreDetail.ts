import { useEffect, useState } from 'react'
import { fetchOwnerStore } from '../api/owner/store'
import { fetchStoreDetail, type StoreDetailDto } from '../api/store'
import { ApiError } from '../api/authClient'
import { getOwnerStoreId, useOwnerMockData } from '../lib/ownerConfig'
import { getMockStoreDetail } from '../lib/mocks/ownerMockData'
import { setActiveStoreId } from '../lib/ownerSession'

export function useOwnerStoreDetail() {
  const fallbackStoreId = getOwnerStoreId()
  const mockMode = useOwnerMockData()
  const [storeId, setStoreId] = useState(fallbackStoreId)
  const [store, setStore] = useState<StoreDetailDto | null>(mockMode ? getMockStoreDetail(fallbackStoreId) : null)
  const [loading, setLoading] = useState(!mockMode)
  const [error, setError] = useState<string | null>(null)

  const applyStore = (next: StoreDetailDto | null) => {
    setStore(next)
  }

  useEffect(() => {
    if (mockMode) {
      setStoreId(fallbackStoreId)
      setStore(getMockStoreDetail(fallbackStoreId))
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void (async () => {
      try {
        const mine = await fetchOwnerStore()
        if (cancelled) return
        setStoreId(mine.storeId)
        setActiveStoreId(mine.storeId)
        setStore({
          storeId: mine.storeId,
          name: mine.name,
          address: mine.address,
          phoneNumber: mine.phoneNumber,
          originInfo: mine.originInfo?.trim() || '',
          cookingTimeMinutes: mine.cookingTimeMinutes ?? 15,
          minOrderAmount: mine.minOrderAmount ?? 0,
          categoryId: mine.categoryId ?? null,
          imageUrl: mine.imageUrl?.trim() || null,
          operatingHours: mine.operatingHours ?? null,
          notice: mine.notice ?? null,
          menus: [],
        })
        // 메뉴 목록이 필요하면 고객용 상세로 보강
        try {
          const full = await fetchStoreDetail(mine.storeId, { skipAuth: true })
          if (!cancelled) {
            setStore({
              ...full,
              categoryId: full.categoryId ?? mine.categoryId ?? null,
              minOrderAmount: full.minOrderAmount ?? mine.minOrderAmount ?? 0,
              cookingTimeMinutes: full.cookingTimeMinutes ?? mine.cookingTimeMinutes ?? 15,
              imageUrl: full.imageUrl?.trim() || mine.imageUrl?.trim() || null,
              operatingHours:
                full.operatingHours !== undefined ? full.operatingHours : (mine.operatingHours ?? null),
              notice: full.notice !== undefined ? full.notice : (mine.notice ?? null),
            })
          }
        } catch {
          /* 매장 기본 정보만으로 진행 */
        }
      } catch (e: unknown) {
        if (cancelled) return
        setStore(null)
        setError(e instanceof ApiError ? e.message : '매장 정보를 불러오지 못했습니다.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [fallbackStoreId, mockMode])

  return { storeId, store, setStore: applyStore, loading, error, mockMode }
}
