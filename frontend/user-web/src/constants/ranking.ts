/**
 * 주간 회원 랭킹 (데모) — 추후 API 연동 시 이 파일/훅만 교체
 */

export interface RankingEntry {
  rank: number
  memberProfileId: number
  nickname: string
  tierLabel: string
  cumulativeXp: number
  orderCount: number
  walkingDistanceM: number
  reviewCount: number
  attendanceStreak: number
  avatarUrl: string
}

/** 데모 원본 (등급별 1명) — rank 필드는 정렬 후 덮어씀 */
const WEEKLY_MEMBER_RANKINGS_RAW: RankingEntry[] = [
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
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop',
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
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop',
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
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop',
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
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop',
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
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=128&h=128&fit=crop',
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
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&h=128&fit=crop',
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
    avatarUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303a12?w=128&h=128&fit=crop',
  },
]

/** 누적 도보 거리 내림차순 순위 (홈·랭킹 페이지 공통) */
export function getWeeklyRankingsByWalkingDistance(): RankingEntry[] {
  return [...WEEKLY_MEMBER_RANKINGS_RAW]
    .sort((a, b) => b.walkingDistanceM - a.walkingDistanceM)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

/** @deprecated 직접 사용 대신 getWeeklyRankingsByWalkingDistance() 권장 */
export const WEEKLY_MEMBER_RANKINGS = getWeeklyRankingsByWalkingDistance()
