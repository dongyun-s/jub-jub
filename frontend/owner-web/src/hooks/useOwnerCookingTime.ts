import { useCallback, useEffect, useState } from 'react'
import {
  COOKING_TIME_STEP,
  clampCookingMinutes,
  readStoredBaseCookingMinutes,
  writeStoredBaseCookingMinutes,
} from '../lib/ownerPickupTime'

/**
 * 매장 기본 조리·픽업 시간(분).
 * API 값을 초기값으로 쓰고, 사장님이 변경한 값은 localStorage에 보관(API PATCH 전).
 */
export function useOwnerCookingTime(storeId: number, apiBaseMinutes: number | undefined) {
  const apiDefault = apiBaseMinutes ?? 15

  const [baseMinutes, setBaseMinutesState] = useState(() => {
    return readStoredBaseCookingMinutes(storeId) ?? apiDefault
  })

  useEffect(() => {
    const stored = readStoredBaseCookingMinutes(storeId)
    if (stored != null) {
      setBaseMinutesState(stored)
      return
    }
    if (apiBaseMinutes != null) {
      setBaseMinutesState(clampCookingMinutes(apiBaseMinutes))
    }
  }, [storeId, apiBaseMinutes])

  const setBaseMinutes = useCallback(
    (next: number) => {
      const clamped = clampCookingMinutes(next)
      setBaseMinutesState(clamped)
      writeStoredBaseCookingMinutes(storeId, clamped)
    },
    [storeId],
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
  }
}
