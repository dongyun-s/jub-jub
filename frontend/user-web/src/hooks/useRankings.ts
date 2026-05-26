import { useCallback, useEffect, useState } from 'react'
import {
  fetchRankings,
  type RankingEntryDto,
  type RankingPeriod,
} from '../api/ranking'
import { LIVE_API } from '../lib/liveApi'
import { getMockRankings } from '../lib/mocks/ranking'

export function useRankings(period: RankingPeriod) {
  const [entries, setEntries] = useState<RankingEntryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMock, setIsMock] = useState(!LIVE_API.ranking)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (LIVE_API.ranking) {
        const data = await fetchRankings(period)
        setEntries(data.entries)
        setIsMock(false)
      } else {
        setEntries(getMockRankings(period))
        setIsMock(true)
      }
    } catch {
      setEntries(getMockRankings(period))
      setIsMock(true)
      setError('랭킹을 불러오지 못했습니다. 데모 데이터를 표시합니다.')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    void load()
  }, [load])

  return { entries, loading, error, isMock, reload: load }
}
