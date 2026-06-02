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
  /** 일시 중지 남은 분 (1초마다 갱신) */
  remainingMinutes: number | null
  /** "42분 남음" */
  remainingMinutesLabel: string | null
  resumeSales: () => void
  pauseForMinutes: (minutes: number) => void
  pauseIndefinitely: () => void
  /** false: 재개, true: 무기한 중지 */
  setSalesPaused: (paused: boolean) => void
  formatRemainingLabel: () => string | null
  formatResumeAtLabel: () => string | null
}

const OwnerSalesContext = createContext<OwnerSalesContextValue | null>(null)

export function OwnerSalesProvider({ children }: { children: ReactNode }) {
  const storeId = getOwnerStoreId()
  const [pauseState, setPauseState] = useState<SalesPauseState>(() => readSalesPause(storeId))
  const [now, setNow] = useState(() => Date.now())

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

  const resumeSales = useCallback(() => {
    applyState({ paused: false, untilMs: null })
  }, [applyState])

  const pauseForMinutes = useCallback(
    (minutes: number) => {
      const mins = Math.max(5, Math.min(24 * 60, Math.round(minutes)))
      applyState({ paused: true, untilMs: Date.now() + mins * 60_000 })
    },
    [applyState],
  )

  const pauseIndefinitely = useCallback(() => {
    applyState({ paused: true, untilMs: null })
  }, [applyState])

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
        return next
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [pauseState.paused, pauseState.untilMs, storeId])

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
