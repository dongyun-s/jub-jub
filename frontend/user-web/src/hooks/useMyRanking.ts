import { useCallback, useEffect, useState } from 'react'
import { fetchMyRanking, type MyRankingDto } from '../api/ranking'

export function useMyRanking() {
  const [data, setData] = useState<MyRankingDto | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchMyRanking()
      setData(res)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { myRanking: data, loading, reload: load }
}
