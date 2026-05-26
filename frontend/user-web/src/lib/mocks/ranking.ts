import type { MyRankingDto, RankingEntryDto, RankingPeriod } from '../../api/ranking'

const RAW: RankingEntryDto[] = [
  {
    rank: 1,
    memberProfileId: 1001,
    nickname: '레전드왕',
    tierLabel: 'LEGEND',
    cumulativeXp: 28400,
    orderCount: 58,
    walkingDistanceM: 31200,
    reviewCount: 32,
    attendanceStreak: 21,
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop',
  },
  {
    rank: 2,
    memberProfileId: 1002,
    nickname: '플래티넘지니',
    tierLabel: 'PLATINUM',
    cumulativeXp: 22100,
    orderCount: 49,
    walkingDistanceM: 27800,
    reviewCount: 24,
    attendanceStreak: 18,
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop',
  },
  {
    rank: 3,
    memberProfileId: 1003,
    nickname: '다이아민지',
    tierLabel: 'DIAMOND',
    cumulativeXp: 18600,
    orderCount: 44,
    walkingDistanceM: 25600,
    reviewCount: 19,
    attendanceStreak: 15,
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop',
  },
  {
    rank: 4,
    memberProfileId: 1004,
    nickname: '줍줍마스터',
    tierLabel: 'GOLD',
    cumulativeXp: 15200,
    orderCount: 42,
    walkingDistanceM: 24300,
    reviewCount: 18,
    attendanceStreak: 12,
    avatarUrl:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop',
  },
  {
    rank: 5,
    memberProfileId: 1005,
    nickname: '픽업왕민수',
    tierLabel: 'SILVER',
    cumulativeXp: 12840,
    orderCount: 38,
    walkingDistanceM: 19800,
    reviewCount: 11,
    attendanceStreak: 9,
    avatarUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=128&h=128&fit=crop',
  },
  {
    rank: 6,
    memberProfileId: 1006,
    nickname: '리뷰요정',
    tierLabel: 'BRONZE',
    cumulativeXp: 9820,
    orderCount: 27,
    walkingDistanceM: 15400,
    reviewCount: 27,
    attendanceStreak: 14,
    avatarUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&h=128&fit=crop',
  },
  {
    rank: 7,
    memberProfileId: 1007,
    nickname: '새내기줍줍',
    tierLabel: 'MEMBER',
    cumulativeXp: 3200,
    orderCount: 8,
    walkingDistanceM: 4200,
    reviewCount: 3,
    attendanceStreak: 2,
    avatarUrl:
      'https://images.unsplash.com/photo-1527980965255-d3b416303a12?w=128&h=128&fit=crop',
  },
]

function sortByWalking(entries: RankingEntryDto[]): RankingEntryDto[] {
  return [...entries]
    .sort((a, b) => b.walkingDistanceM - a.walkingDistanceM)
    .map((e, i) => ({ ...e, rank: i + 1 }))
}

/** 주간: 데모는 동일 목록, 기간 라벨만 구분 */
export function getMockRankings(period: RankingPeriod): RankingEntryDto[] {
  const sorted = sortByWalking(RAW)
  if (period === 'ALL') {
    return sorted.map((e) => ({
      ...e,
      walkingDistanceM: Math.round(e.walkingDistanceM * 4.2),
      cumulativeXp: Math.round(e.cumulativeXp * 3.1),
    }))
  }
  return sorted
}

export function getMockMyRanking(
  period: RankingPeriod,
  memberProfileId?: number | null,
): MyRankingDto {
  const list = getMockRankings(period)
  const mine =
    memberProfileId != null
      ? list.find((e) => e.memberProfileId === memberProfileId)
      : list.find((e) => e.memberProfileId === 1005)

  if (!mine) {
    return {
      period,
      rank: 0,
      totalParticipants: list.length + 120,
      isRanked: false,
      nickname: '나',
      tierLabel: 'BRONZE',
      walkingDistanceM: 5200,
      cumulativeXp: 2100,
      orderCount: 6,
    }
  }

  return {
    period,
    rank: mine.rank,
    totalParticipants: list.length + 120,
    isRanked: true,
    nickname: mine.nickname,
    tierLabel: mine.tierLabel,
    walkingDistanceM: mine.walkingDistanceM,
    cumulativeXp: mine.cumulativeXp,
    orderCount: mine.orderCount,
    rankChange: period === 'WEEKLY' ? 1 : undefined,
  }
}
