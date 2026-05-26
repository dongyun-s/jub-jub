/**
 * 랭킹 타입·데모 re-export — UI는 hooks(useRankings) 사용 권장
 */
import { getMockRankings } from '../lib/mocks/ranking'

export type { RankingEntryDto as RankingEntry, RankingPeriod } from '../api/ranking'

/** @deprecated useRankings('WEEKLY') 사용 */
export function getWeeklyRankingsByWalkingDistance() {
  return getMockRankings('WEEKLY')
}
