import { resolveTierKey, type TierKey } from './rewardTierTheme'

import tierBronze from '../assets/tier/tier-bronze.svg'
import tierSilver from '../assets/tier/tier-silver.svg'
import tierGold from '../assets/tier/tier-gold.svg'
import tierDiamond from '../assets/tier/tier-diamond.svg'
import tierPlatinum from '../assets/tier/tier-platinum.svg'
import tierLegend from '../assets/tier/tier-legend.svg'

const TIER_ICON_SRC: Record<Exclude<TierKey, 'default'>, string> = {
  bronze: tierBronze,
  silver: tierSilver,
  gold: tierGold,
  diamond: tierDiamond,
  platinum: tierPlatinum,
  legend: tierLegend,
}

export function getTierIconSrc(
  tier: string | null | undefined,
  tierName: string | null | undefined,
): string | null {
  const key = resolveTierKey(tier, tierName)
  if (key === 'default') return null
  return TIER_ICON_SRC[key]
}

export function getTierIconKey(
  tier: string | null | undefined,
  tierName: string | null | undefined,
): Exclude<TierKey, 'default'> | null {
  const key = resolveTierKey(tier, tierName)
  return key === 'default' ? null : key
}
