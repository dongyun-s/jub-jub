/**
 * 랭킹 API
 * - GET /api/v1/rankings?page=0&size=10
 * - GET /api/v1/rankings/me
 */
import { apiV1FetchPlain } from './authClient'

/** UI에서 사용되는 엔트리(내부 표준) */
export interface RankingEntryDto {
  rank: number
  /** 백엔드 userId */
  memberProfileId: number
  nickname: string
  /** GOLD, SILVER ... */
  tierLabel: string
  /** 누적 도보 (m) — 기존 UI 호환 */
  walkingDistanceM: number
  /** 픽업(주문) 횟수 */
  orderCount: number
  /** 프로필 이미지 URL */
  avatarUrl: string
}

export interface RankingsListDto {
  page: number
  size: number
  totalUsers: number
  entries: RankingEntryDto[]
}

export interface MyRankingDto {
  rank: number
  totalParticipants: number
  isRanked: boolean
  memberProfileId: number
  nickname: string
  tierLabel: string
  walkingDistanceM: number
  orderCount: number
  avatarUrl: string
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
  const memberProfileId = num(p.userId ?? p.user_id ?? p.memberProfileId ?? p.member_profile_id)
  const nickname = str(p.nickname).trim()
  if (!memberProfileId || !nickname) return null
  const km = num(p.totalDistanceKm ?? p.total_distance_km)
  const walkingDistanceM = Math.max(0, Math.round(km * 1000))
  return {
    rank: num(p.ranking ?? p.rank),
    memberProfileId,
    nickname,
    tierLabel: str(p.tierLabel ?? p.tier_label ?? p.tier, 'MEMBER'),
    walkingDistanceM,
    orderCount: num(p.pickupCount ?? p.pickup_count ?? p.orderCount ?? p.order_count),
    avatarUrl: str(p.profileImageUrl ?? p.profile_image_url ?? p.avatarUrl ?? p.avatar_url),
  }
}

function parseRankingsList(body: unknown): RankingsListDto {
  const o = (typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}) as Record<
    string,
    unknown
  >
  const arr = o.rankings ?? o.entries ?? o.items
  const rankings = Array.isArray(arr) ? arr : []
  return {
    page: num(o.page),
    size: num(o.size),
    totalUsers: num(o.totalUsers ?? o.total_users),
    entries: rankings.map(normalizeEntry).filter(Boolean) as RankingEntryDto[],
  }
}

function parseMyRanking(body: unknown): MyRankingDto {
  const p = (typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}) as Record<
    string,
    unknown
  >
  const km = num(p.totalDistanceKm ?? p.total_distance_km)
  const walkingDistanceM = Math.max(0, Math.round(km * 1000))
  const rank = num(p.ranking ?? p.rank)
  return {
    rank,
    totalParticipants: num(p.totalUsers ?? p.total_users),
    isRanked: rank > 0,
    memberProfileId: num(p.userId ?? p.user_id),
    nickname: str(p.nickname, '회원'),
    tierLabel: str(p.tierLabel ?? p.tier_label ?? p.tier, 'MEMBER'),
    walkingDistanceM,
    orderCount: num(p.pickupCount ?? p.pickup_count ?? p.orderCount ?? p.order_count),
    avatarUrl: str(p.profileImageUrl ?? p.profile_image_url ?? p.avatarUrl ?? p.avatar_url),
  }
}

/** GET /api/v1/rankings?page&size */
export async function fetchRankings(params: { page?: number; size?: number } = {}): Promise<RankingsListDto> {
  const q = new URLSearchParams({
    page: String(params.page ?? 0),
    size: String(params.size ?? 50),
  })
  const raw = await apiV1FetchPlain<unknown>(`/rankings?${q.toString()}`)
  return parseRankingsList(raw)
}

/** GET /api/v1/rankings/me */
export async function fetchMyRanking(): Promise<MyRankingDto> {
  const raw = await apiV1FetchPlain<unknown>(`/rankings/me`)
  return parseMyRanking(raw)
}
