import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchOwnerStore, updateOwnerStoreStatus } from '../api/owner/store'
import { getOwnerStoreId, useOwnerMockData } from '../lib/ownerConfig'
import {
  formatPauseRemaining,
  formatPauseRemainingMinutes,
  formatPauseResumeAt,
  getPauseRemainingMinutes,
  readSalesPause,
  writeSalesPause,
  type SalesPauseState,
} from '../lib/ownerSalesStatus'

type OwnerSalesContextValue = {
  salesPaused: boolean
  pauseUntilMs: number | null
  isScheduledPause: boolean
  isIndefinitePause: boolean
  remainingMinutes: number | null
  remainingMinutesLabel: string | null
  resumeSales: () => void
  pauseForMinutes: (minutes: number) => void
  pauseIndefinitely: () => void
  setSalesPaused: (paused: boolean) => void
  formatRemainingLabel: () => string | null
  formatResumeAtLabel: () => string | null
  storeName: string | null
}

const OwnerSalesContext = createContext<OwnerSalesContextValue | null>(null)

export function OwnerSalesProvider({ children }: { children: ReactNode }) {
  const storeId = getOwnerStoreId()
  const useMock = useOwnerMockData()
  const [pauseState, setPauseState] = useState<SalesPauseState>(() => readSalesPause(storeId))
  const [now, setNow] = useState(() => Date.now())
  const [storeName, setStoreName] = useState<string | null>(null)

  const syncFromApi = useCallback(async () => {
    if (useMock) return
    try {
      const store = await fetchOwnerStore()
      setStoreName(store.name)
      const paused = store.status === 'PAUSED' || store.status === 'CLOSED'
      const next = { paused, untilMs: null as number | null }
      setPauseState(next)
      writeSalesPause(store.storeId || storeId, next)
    } catch {
      /* 로컬 상태 유지 */
    }
  }, [useMock, storeId])

  useEffect(() => {
    void syncFromApi()
  }, [syncFromApi])

  const applyState = useCallback(
    (next: SalesPauseState) => {
      const normalized = { ...next }
      if (normalized.paused && normalized.untilMs != null && normalized.untilMs <= Date.now()) {
        normalized.paused = false
        normalized.untilMs = null
      }
      setPauseState(normalized)
      writeSalesPause(storeId, normalized)
    },
    [storeId],
  )

  const pushStatus = useCallback(
    async (status: 'OPEN' | 'PAUSED' | 'CLOSED') => {
      if (useMock) return
      try {
        await updateOwnerStoreStatus({ status })
        await syncFromApi()
      } catch {
        /* 로컬만 반영된 상태일 수 있음 */
      }
    },
    [useMock, syncFromApi],
  )

  const resumeSales = useCallback(() => {
    applyState({ paused: false, untilMs: null })
    void pushStatus('OPEN')
  }, [applyState, pushStatus])

  const pauseForMinutes = useCallback(
    (minutes: number) => {
      const mins = Math.max(5, Math.min(24 * 60, Math.round(minutes)))
      applyState({ paused: true, untilMs: Date.now() + mins * 60_000 })
      void pushStatus('PAUSED')
    },
    [applyState, pushStatus],
  )

  const pauseIndefinitely = useCallback(() => {
    applyState({ paused: true, untilMs: null })
    void pushStatus('CLOSED')
  }, [applyState, pushStatus])

  const setSalesPaused = useCallback(
    (paused: boolean) => {
      if (paused) pauseIndefinitely()
      else resumeSales()
    },
    [pauseIndefinitely, resumeSales],
  )

  useEffect(() => {
    if (!pauseState.paused || pauseState.untilMs == null) return
    const id = window.setInterval(() => {
      setNow(Date.now())
      setPauseState((prev) => {
        if (!prev.paused || prev.untilMs == null || prev.untilMs > Date.now()) return prev
        const next = { paused: false, untilMs: null }
        writeSalesPause(storeId, next)
        if (!useMock) void updateOwnerStoreStatus({ status: 'OPEN' })
        return next
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [pauseState.paused, pauseState.untilMs, storeId, useMock])

  const salesPaused = pauseState.paused
  const pauseUntilMs = pauseState.paused ? pauseState.untilMs : null
  const isScheduledPause = salesPaused && pauseUntilMs != null
  const isIndefinitePause = salesPaused && pauseUntilMs == null

  const remainingMinutes = useMemo(() => {
    if (!isScheduledPause || pauseUntilMs == null) return null
    return getPauseRemainingMinutes(pauseUntilMs, now)
  }, [isScheduledPause, pauseUntilMs, now])

  const remainingMinutesLabel = useMemo(() => {
    if (!isScheduledPause || pauseUntilMs == null) return null
    return formatPauseRemainingMinutes(pauseUntilMs, now)
  }, [isScheduledPause, pauseUntilMs, now])

  const formatRemainingLabel = useCallback(() => {
    if (!isScheduledPause || pauseUntilMs == null) return null
    return formatPauseRemaining(pauseUntilMs, now)
  }, [isScheduledPause, pauseUntilMs, now])

  const formatResumeAtLabel = useCallback(() => {
    if (!isScheduledPause || pauseUntilMs == null) return null
    return formatPauseResumeAt(pauseUntilMs)
  }, [isScheduledPause, pauseUntilMs])

  const value = useMemo(
    () => ({
      salesPaused,
      pauseUntilMs,
      isScheduledPause,
      isIndefinitePause,
      remainingMinutes,
      remainingMinutesLabel,
      resumeSales,
      pauseForMinutes,
      pauseIndefinitely,
      setSalesPaused,
      formatRemainingLabel,
      formatResumeAtLabel,
      storeName,
    }),
    [
      salesPaused,
      pauseUntilMs,
      isScheduledPause,
      isIndefinitePause,
      remainingMinutes,
      remainingMinutesLabel,
      resumeSales,
      pauseForMinutes,
      pauseIndefinitely,
      setSalesPaused,
      formatRemainingLabel,
      formatResumeAtLabel,
      storeName,
    ],
  )

  return <OwnerSalesContext.Provider value={value}>{children}</OwnerSalesContext.Provider>
}

export function useOwnerSales() {
  const ctx = useContext(OwnerSalesContext)
  if (!ctx) {
    throw new Error('useOwnerSales must be used within OwnerSalesProvider')
  }
  return ctx
}
