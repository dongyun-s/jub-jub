import { getTierIconKey, getTierIconSrc } from '../../lib/tierIcons'
import type { TierKey } from '../../lib/rewardTierTheme'
import styles from './TierIcon.module.css'

export type TierIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SIZE_CLASS: Record<TierIconSize, string> = {
  xs: styles.xs,
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
  xl: styles.xl,
}

const GLOW_CLASS: Record<Exclude<TierKey, 'default'>, string> = {
  bronze: styles.glowBronze,
  silver: styles.glowSilver,
  gold: styles.glowGold,
  diamond: styles.glowDiamond,
  platinum: styles.glowPlatinum,
  legend: styles.glowLegend,
}

export interface TierIconProps {
  tier?: string | null
  tierName?: string | null
  /** tier/tierName 대신 라벨(예: GOLD, LEGEND)만 넘길 때 */
  label?: string
  size?: TierIconSize
  glow?: boolean
  className?: string
  alt?: string
}

export default function TierIcon({
  tier,
  tierName,
  label,
  size = 'sm',
  glow = false,
  className = '',
  alt,
}: TierIconProps) {
  const resolvedTier = label ?? tier
  const resolvedName = label ?? tierName
  const src = getTierIconSrc(resolvedTier, resolvedName)
  const tierKey = getTierIconKey(resolvedTier, resolvedName)

  if (!src) return null

  const glowClass = glow && tierKey ? GLOW_CLASS[tierKey] : ''
  const ariaLabel = alt ?? (label ?? tierName ?? tier ?? '등급 배지')

  return (
    <img
      src={src}
      alt={ariaLabel}
      className={`${styles.icon} ${SIZE_CLASS[size]} ${glowClass} ${className}`.trim()}
      draggable={false}
    />
  )
}
