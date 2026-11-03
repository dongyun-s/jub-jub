import { useCallback, useEffect, useState } from 'react'
import {
  fetchOwnerReviews,
  fetchOwnerReviewSummary,
  type OwnerReviewFilter,
  type OwnerReviewListItemDto,
  type OwnerReviewSummaryDto,
} from '../api/owner/review'
import { ApiError } from '../api/authClient'
import { useOwnerMockData } from '../lib/ownerConfig'
import { getMockOwnerReviewList, getMockOwnerReviewSummary } from '../lib/mocks/ownerMockData'

export function useOwnerReviews(filter: OwnerReviewFilter = 'ALL', keyword = '') {
  const mockMode = useOwnerMockData()
  const [reviews, setReviews] = useState<OwnerReviewListItemDto[]>(
    mockMode ? getMockOwnerReviewList(filter, keyword) : [],
  )
  const [summary, setSummary] = useState<OwnerReviewSummaryDto | null>(
    mockMode ? getMockOwnerReviewSummary() : null,
  )
  const [loading, setLoading] = useState(!mockMode)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (mockMode) {
      setReviews(getMockOwnerReviewList(filter, keyword))
      setSummary(getMockOwnerReviewSummary())
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [list, sum] = await Promise.all([
        fetchOwnerReviews({ filter, keyword }),
        fetchOwnerReviewSummary(),
      ])
      setReviews(list.reviews ?? [])
      setSummary(sum)
    } catch (e: unknown) {
      setReviews([])
      setSummary(null)
      setError(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : '리뷰를 불러오지 못했습니다.',
      )
    } finally {
      setLoading(false)
    }
  }, [filter, keyword, mockMode])

  useEffect(() => {
    let cancelled = false
    setLoading(!mockMode)
    void (async () => {
      try {
        if (mockMode) {
          if (!cancelled) {
            setReviews(getMockOwnerReviewList(filter, keyword))
            setSummary(getMockOwnerReviewSummary())
            setError(null)
            setLoading(false)
          }
          return
        }
        const [list, sum] = await Promise.all([
          fetchOwnerReviews({ filter, keyword }),
          fetchOwnerReviewSummary(),
        ])
        if (cancelled) return
        setReviews(list.reviews ?? [])
        setSummary(sum)
        setError(null)
      } catch (e: unknown) {
        if (cancelled) return
        setReviews([])
        setSummary(null)
        setError(
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : '리뷰를 불러오지 못했습니다.',
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [filter, keyword, mockMode])

  return { reviews, summary, loading, error, mockMode, reload }
}
