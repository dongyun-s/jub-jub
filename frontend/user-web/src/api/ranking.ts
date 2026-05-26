/**
 * 랭킹 API (백엔드 예정)
 * - GET /api/v1/rankings?period=WEEKLY|ALL
 * - GET /api/v1/rankings/me?period=WEEKLY|ALL
 */
import { apiV1Fetch } from './authClient'

export type RankingPeriod = 'WEEKLY' | 'ALL'

export interface RankingEntryDto {
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

export interface RankingsListDto {
  period: RankingPeriod
  entries: RankingEntryDto[]
  updatedAt?: string
}

export interface MyRankingDto {
  period: RankingPeriod
  rank: number
  totalParticipants: number
  isRanked: boolean
  nickname: string
  tierLabel: string
  walkingDistanceM: number
  cumulativeXp: number
  orderCount: number
  rankChange?: number
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (!Number.isNaN(n)) return n
  }
  return fallback
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function normalizeEntry(raw: unknown): RankingEntryDto | null {
  if (typeof raw !== 'object' || raw === null) return null
  const p = raw as Record<string, unknown>
  const memberProfileId = num(p.memberProfileId ?? p.member_profile_id)
  const nickname = str(p.nickname).trim()
  if (!memberProfileId || !nickname) return null
  return {
    rank: num(p.rank),
    memberProfileId,
    nickname,
    tierLabel: str(p.tierLabel ?? p.tier_label, 'MEMBER'),
    cumulativeXp: num(p.cumulativeXp ?? p.cumulative_xp),
    orderCount: num(p.orderCount ?? p.order_count),
    walkingDistanceM: num(p.walkingDistanceM ?? p.walking_distance_m),
    reviewCount: num(p.reviewCount ?? p.review_count),
    attendanceStreak: num(p.attendanceStreak ?? p.attendance_streak),
    avatarUrl: str(p.avatarUrl ?? p.avatar_url),
  }
}

function parseRankingsList(body: unknown, period: RankingPeriod): RankingsListDto {
  let inner = body
  if (typeof body === 'object' && body !== null && !Array.isArray(body)) {
    const o = body as Record<string, unknown>
    if (o.success === true && o.data != null) inner = o.data
  }

  if (typeof inner === 'object' && inner !== null && !Array.isArray(inner)) {
    const o = inner as Record<string, unknown>
    const arr = o.entries ?? o.rankings ?? o.items
    if (Array.isArray(arr)) {
      const entries = arr.map(normalizeEntry).filter(Boolean) as RankingEntryDto[]
      return {
        period: (str(o.period, period).toUpperCase() as RankingPeriod) || period,
        entries,
        updatedAt: str(o.updatedAt ?? o.updated_at) || undefined,
      }
    }
  }

  if (Array.isArray(inner)) {
    const entries = inner.map(normalizeEntry).filter(Boolean) as RankingEntryDto[]
    return { period, entries }
  }

  return { period, entries: [] }
}

function parseMyRanking(body: unknown, period: RankingPeriod): MyRankingDto {
  let inner = body
  if (typeof body === 'object' && body !== null && !Array.isArray(body)) {
    const o = body as Record<string, unknown>
    if (o.success === true && o.data != null) inner = o.data
    else if (!('rank' in o) && o.data == null) inner = o
  }

  const p = (typeof inner === 'object' && inner !== null ? inner : {}) as Record<string, unknown>
  return {
    period: (str(p.period, period).toUpperCase() as RankingPeriod) || period,
    rank: num(p.rank),
    totalParticipants: num(p.totalParticipants ?? p.total_participants),
    isRanked: p.isRanked === true || p.is_ranked === true || num(p.rank) > 0,
    nickname: str(p.nickname, '회원'),
    tierLabel: str(p.tierLabel ?? p.tier_label, 'MEMBER'),
    walkingDistanceM: num(p.walkingDistanceM ?? p.walking_distance_m),
    cumulativeXp: num(p.cumulativeXp ?? p.cumulative_xp),
    orderCount: num(p.orderCount ?? p.order_count),
    rankChange: num(p.rankChange ?? p.rank_change) || undefined,
  }
}

/** GET /api/v1/rankings */
export async function fetchRankings(period: RankingPeriod): Promise<RankingsListDto> {
  const q = new URLSearchParams({ period })
  const raw = await apiV1Fetch<unknown>(`/rankings?${q.toString()}`)
  return parseRankingsList(raw, period)
}

/** GET /api/v1/rankings/me */
export async function fetchMyRanking(period: RankingPeriod): Promise<MyRankingDto> {
  const q = new URLSearchParams({ period })
  const raw = await apiV1Fetch<unknown>(`/rankings/me?${q.toString()}`)
  return parseMyRanking(raw, period)
}
