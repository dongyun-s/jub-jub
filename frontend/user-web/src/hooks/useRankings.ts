import { useCallback, useEffect, useState } from 'react'
import { fetchRankings, type RankingEntryDto } from '../api/ranking'

export function useRankings() {
  const [entries, setEntries] = useState<RankingEntryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalUsers, setTotalUsers] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchRankings({ page: 0, size: 50 })
      setEntries(data.entries)
      setTotalUsers(data.totalUsers)
    } catch {
      setEntries([])
      setTotalUsers(0)
      setError('랭킹을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { entries, totalUsers, loading, error, reload: load }
}
