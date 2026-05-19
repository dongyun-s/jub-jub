import { getTierTheme, type TierTheme } from '../../lib/rewardTierTheme'
import TierIcon from '../TierIcon/TierIcon'
import styles from './TierBadge.module.css'

export interface TierLabelColors {
  color: string
  borderColor: string
  backgroundColor: string
  iconColor: string
}

export function getTierLabelColors(tierLabel: string): TierLabelColors {
  const theme = getTierTheme(tierLabel, tierLabel)
  const accent = theme.myGoalBadgeColor
  return {
    color: theme.myTierNameColor,
    borderColor: `${accent}40`,
    backgroundColor: `${accent}14`,
    iconColor: theme.myAvatarIcon,
  }
}

interface TierBadgeProps {
  label: string
  className?: string
  /** soft: 연한 배경 / gradient: 등급 그라데이션 뱃지 */
  variant?: 'soft' | 'gradient'
  size?: 'sm' | 'md'
}

export default function TierBadge({
  label,
  className = '',
  variant = 'soft',
  size = 'sm',
}: TierBadgeProps) {
  const theme = getTierTheme(label, label)
  const colors = getTierLabelColors(label)
  const sizeClass = size === 'md' ? styles.badgeMd : ''

  if (variant === 'gradient') {
    return (
      <span
        className={`${styles.badge} ${styles.badgeGradient} ${sizeClass} ${className}`.trim()}
        style={{
          backgroundImage: theme.myBadgeGradient,
          boxShadow: theme.gradeCardShadow,
          color: '#fff',
        }}
      >
        <TierIcon label={label} size={size === 'md' ? 'sm' : 'xs'} alt="" />
        {label}
      </span>
    )
  }

  return (
    <span
      className={`${styles.badge} ${sizeClass} ${className}`.trim()}
      style={{
        color: colors.color,
        borderColor: colors.borderColor,
        backgroundColor: colors.backgroundColor,
      }}
    >
      <TierIcon label={label} size={size === 'md' ? 'sm' : 'xs'} alt="" />
      {label}
    </span>
  )
}

export function getTierThemeForLabel(tierLabel: string): TierTheme {
  return getTierTheme(tierLabel, tierLabel)
}
