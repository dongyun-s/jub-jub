import { useCallback, useEffect, useState } from 'react'
import { fetchMyRanking, type MyRankingDto, type RankingPeriod } from '../api/ranking'
import { getCachedMemberProfileId } from '../lib/authStorage'
import { LIVE_API } from '../lib/liveApi'
import { getMockMyRanking } from '../lib/mocks/ranking'

export function useMyRanking(period: RankingPeriod) {
  const [data, setData] = useState<MyRankingDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMock, setIsMock] = useState(!LIVE_API.ranking)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (LIVE_API.ranking) {
        const res = await fetchMyRanking(period)
        setData(res)
        setIsMock(false)
      } else {
        setData(getMockMyRanking(period, getCachedMemberProfileId()))
        setIsMock(true)
      }
    } catch {
      setData(getMockMyRanking(period, getCachedMemberProfileId()))
      setIsMock(true)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    void load()
  }, [load])

  return { myRanking: data, loading, isMock, reload: load }
}
