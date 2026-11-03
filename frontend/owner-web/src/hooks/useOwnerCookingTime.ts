import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/authClient'
import { updateOwnerStoreCookingTime } from '../api/owner/store'
import { useOwnerMockData } from '../lib/ownerConfig'
import { COOKING_TIME_STEP, clampCookingMinutes } from '../lib/ownerPickupTime'

const listeners = new Set<(storeId: number, minutes: number) => void>()

function publishCookingMinutes(storeId: number, minutes: number) {
  listeners.forEach((listener) => listener(storeId, minutes))
}

/**
 * 매장 기본 조리 시간(분).
 * 조회값은 DB의 cookingTimeMinutes를 쓰고, 변경은 PATCH /owner/store/cooking-time 으로 저장한다.
 */
export function useOwnerCookingTime(storeId: number, apiBaseMinutes: number | undefined) {
  const mockMode = useOwnerMockData()
  const apiDefault = apiBaseMinutes ?? 15
  const [baseMinutes, setBaseMinutesState] = useState(() => clampCookingMinutes(apiDefault))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestSeq = useRef(0)
  const confirmedRef = useRef(clampCookingMinutes(apiDefault))
  const savedMinutesRef = useRef<number | null>(null)
  const lastStoreIdRef = useRef(storeId)

  useEffect(() => {
    if (lastStoreIdRef.current !== storeId) {
      savedMinutesRef.current = null
      lastStoreIdRef.current = storeId
    }
    if (apiBaseMinutes == null) return
    const next = clampCookingMinutes(apiBaseMinutes)
    if (savedMinutesRef.current != null && savedMinutesRef.current !== next) return
    confirmedRef.current = next
    setBaseMinutesState(next)
  }, [storeId, apiBaseMinutes])

  useEffect(() => {
    const onPublished = (id: number, minutes: number) => {
      if (id !== storeId) return
      const next = clampCookingMinutes(minutes)
      savedMinutesRef.current = next
      confirmedRef.current = next
      setBaseMinutesState(next)
    }
    listeners.add(onPublished)
    return () => {
      listeners.delete(onPublished)
    }
  }, [storeId])

  const setBaseMinutes = useCallback(
    (next: number) => {
      const clamped = clampCookingMinutes(next)
      if (mockMode) {
        setBaseMinutesState(clamped)
        setError(null)
        return
      }

      const seq = ++requestSeq.current
      setBaseMinutesState(clamped)
      setSaving(true)
      setError(null)
      void updateOwnerStoreCookingTime(clamped)
        .then((saved) => {
          if (seq !== requestSeq.current) return
          const minutes = clampCookingMinutes(saved.cookingTimeMinutes ?? clamped)
          savedMinutesRef.current = minutes
          confirmedRef.current = minutes
          setBaseMinutesState(minutes)
          publishCookingMinutes(storeId, minutes)
        })
        .catch((e: unknown) => {
          if (seq !== requestSeq.current) return
          setBaseMinutesState(confirmedRef.current)
          setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : '조리 시간 저장에 실패했습니다.')
        })
        .finally(() => {
          if (seq === requestSeq.current) setSaving(false)
        })
    },
    [mockMode, storeId],
  )

  const bumpBase = useCallback(
    (delta: number) => {
      setBaseMinutes(baseMinutes + delta)
    },
    [baseMinutes, setBaseMinutes],
  )

  return {
    baseMinutes,
    setBaseMinutes,
    bumpBase,
    step: COOKING_TIME_STEP,
    saving,
    error,
  }
}
