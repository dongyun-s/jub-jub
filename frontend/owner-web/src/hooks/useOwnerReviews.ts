import { useEffect, useState } from 'react'
import { fetchStoreReviews, type ReviewDto } from '../api/reviews'
import { getOwnerStoreId, useOwnerMockData } from '../lib/ownerConfig'
import { getMockStoreReviews } from '../lib/mocks/ownerMockData'

export function useOwnerReviews() {
  const storeId = getOwnerStoreId()
  const mockMode = useOwnerMockData()
  const [reviews, setReviews] = useState<ReviewDto[]>(mockMode ? getMockStoreReviews(storeId) : [])
  const [loading, setLoading] = useState(!mockMode)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mockMode) {
      setReviews(getMockStoreReviews(storeId))
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    void fetchStoreReviews(storeId)
      .then((list) => {
        if (!cancelled) setReviews(list)
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setReviews([])
          setError(e instanceof Error ? e.message : '리뷰를 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [storeId, mockMode])

  return { reviews, loading, error, mockMode }
}
