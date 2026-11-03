import { fetchRewardMe, type RewardMeResponse } from '../api/rewards'

export type PickupRewardBreakdown = {
  walkedMeters: number
  orderCountGain: number
  totalOrderCount: number
  totalWalkingDistanceM: number
  tierName: string
  tierCode: string
  tierUpgraded: boolean
  previousTierName?: string
  /** 서버 orderCount가 기준 대비 증가했는지 */
  rewardApplied: boolean
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 픽업 완료 후 서버 리워드 적립이 반영될 때까지 /rewards/me 재조회 */
export async function pollRewardAfterPickup(
  before: RewardMeResponse,
  options?: { maxAttempts?: number; intervalMs?: number },
): Promise<RewardMeResponse> {
  const maxAttempts = options?.maxAttempts ?? 12
  const intervalMs = options?.intervalMs ?? 400

  for (let i = 0; i < maxAttempts; i++) {
    const after = await fetchRewardMe()
    if (after.orderCount > before.orderCount) {
      return after
    }
    if (after.totalWalkingDistance > before.totalWalkingDistance) {
      return after
    }
    if (
      after.tier.trim().toUpperCase() !== before.tier.trim().toUpperCase() &&
      after.tier.trim() !== ''
    ) {
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
    walkedMeters,
    orderCountGain,
    totalOrderCount: after.orderCount,
    totalWalkingDistanceM: after.totalWalkingDistance,
    tierName: after.tierName || after.tier || '—',
    tierCode: after.tier,
    tierUpgraded,
    previousTierName: tierUpgraded ? before.tierName || before.tier : undefined,
    rewardApplied: orderCountGain > 0 || walkedMeters > 0 || tierUpgraded,
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
