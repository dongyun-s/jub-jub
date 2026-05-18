import { fetchRewardMe, type RewardMeResponse } from '../api/rewards'

/** 백엔드 OrderService.completePickup → PickupCompletedEvent 기본 XP */
export const PICKUP_EARNED_XP = 100

export type PickupRewardBreakdown = {
  earnedXp: number
  walkedMeters: number
  orderCountGain: number
  totalOrderCount: number
  totalWalkingDistanceM: number
  tierName: string
  tierUpgraded: boolean
  previousTierName?: string
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 픽업 완료 후 비동기 리워드 적립이 반영될 때까지 /rewards/me 재조회 */
export async function pollRewardAfterPickup(
  before: RewardMeResponse,
  options?: { maxAttempts?: number; intervalMs?: number },
): Promise<RewardMeResponse> {
  const maxAttempts = options?.maxAttempts ?? 10
  const intervalMs = options?.intervalMs ?? 350

  for (let i = 0; i < maxAttempts; i++) {
    const after = await fetchRewardMe()
    if (after.orderCount > before.orderCount) {
      return after
    }
    if (after.totalWalkingDistance > before.totalWalkingDistance) {
      return after
    }
    await sleep(intervalMs)
  }
  return fetchRewardMe()
}

export function buildPickupRewardBreakdown(
  before: RewardMeResponse,
  after: RewardMeResponse,
): PickupRewardBreakdown {
  const orderCountGain = Math.max(0, after.orderCount - before.orderCount)
  const walkedMeters = Math.max(0, after.totalWalkingDistance - before.totalWalkingDistance)
  const tierUpgraded =
    before.tier.trim().toUpperCase() !== after.tier.trim().toUpperCase() ||
    (before.tierName !== after.tierName && orderCountGain > 0)

  return {
    /** 픽업 완료 API 성공 시 서버가 고정 지급하는 XP */
    earnedXp: PICKUP_EARNED_XP,
    walkedMeters,
    orderCountGain,
    totalOrderCount: after.orderCount,
    totalWalkingDistanceM: after.totalWalkingDistance,
    tierName: after.tierName,
    tierUpgraded,
    previousTierName: tierUpgraded ? before.tierName : undefined,
  }
}

export function formatWalkedDistance(meters: number): string {
  if (meters <= 0) return '0m'
  if (meters >= 1000) {
    const km = Math.round((meters / 1000) * 10) / 10
    return `${km}km`
  }
  return `${Math.round(meters)}m`
}
