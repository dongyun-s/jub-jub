import type { RankingEntryDto } from '../api/ranking'

type RankingEntry = RankingEntryDto

export function formatWalkingDistance(meters: number): string {
  if (meters >= 1000) {
    const km = Math.round((meters / 1000) * 10) / 10
    return `${km}km`
  }
  return `${meters.toLocaleString('ko-KR')}m`
}

/** 홈 한 줄: 누적 도보 km */
export function formatRankingStripDistanceKm(meters: number): string {
  const km = Math.round((meters / 1000) * 10) / 10
  return `${km}km`
}

/** 접근성·스크린리더용 요약 */
export function formatRankingStripMeta(entry: RankingEntry): string {
  return `${entry.rank}위 ${entry.tierLabel} ${entry.nickname}, 누적 ${formatRankingStripDistanceKm(entry.walkingDistanceM)}`
}
