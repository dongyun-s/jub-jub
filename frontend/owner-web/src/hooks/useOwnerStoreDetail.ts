import { useEffect, useState } from 'react'
import { fetchStoreDetail, type StoreDetailDto } from '../api/store'
import { ApiError } from '../api/authClient'
import { getOwnerStoreId, useOwnerMockData } from '../lib/ownerConfig'
import { getMockStoreDetail } from '../lib/mocks/ownerMockData'

export function useOwnerStoreDetail() {
  const storeId = getOwnerStoreId()
  const mockMode = useOwnerMockData()
  const [store, setStore] = useState<StoreDetailDto | null>(mockMode ? getMockStoreDetail(storeId) : null)
  const [loading, setLoading] = useState(!mockMode)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mockMode) {
      setStore(getMockStoreDetail(storeId))
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    void fetchStoreDetail(storeId, { skipAuth: true })
      .then((data) => {
        if (!cancelled) setStore(data)
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setStore(null)
          setError(e instanceof ApiError ? e.message : '매장 정보를 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [storeId, mockMode])

  return { storeId, store, loading, error, mockMode }
}
