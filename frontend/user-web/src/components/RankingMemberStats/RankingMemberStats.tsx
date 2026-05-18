import type { RankingEntry } from '../../constants/ranking'
import { getTierLabelColors } from '../TierBadge/TierBadge'
import TierIcon from '../TierIcon/TierIcon'
import { getTierTheme } from '../../lib/rewardTierTheme'
import { formatWalkingDistance } from '../../lib/rankingDisplay'
import styles from './RankingMemberStats.module.css'

interface RankingMemberStatsProps {
  entry: RankingEntry
  /** 홈 롤링 등 좁은 영역 */
  compact?: boolean
  /** 랭킹 페이지 — 등급 컬러로 칩 전체 강조 */
  themed?: boolean
}

const statItems = [
  { key: 'xp', icon: 'bolt', label: (e: RankingEntry) => `XP ${e.cumulativeXp.toLocaleString('ko-KR')}` },
  { key: 'order', icon: 'shopping_bag', label: (e: RankingEntry) => `픽업 ${e.orderCount}회` },
  {
    key: 'walk',
    icon: 'directions_walk',
    label: (e: RankingEntry) => formatWalkingDistance(e.walkingDistanceM),
  },
  { key: 'review', icon: 'rate_review', label: (e: RankingEntry) => `리뷰 ${e.reviewCount}개` },
  {
    key: 'attendance',
    icon: 'local_fire_department',
    label: (e: RankingEntry) => `연속 출석 ${e.attendanceStreak}일`,
  },
] as const

export default function RankingMemberStats({
  entry,
  compact = false,
  themed = false,
}: RankingMemberStatsProps) {
  const tierColors = getTierLabelColors(entry.tierLabel)
  const tierTheme = getTierTheme(entry.tierLabel, entry.tierLabel)

  if (compact) {
    return (
      <span className={styles.compactMeta}>
        <span style={{ color: tierColors.color, fontWeight: 700 }}>{entry.tierLabel}</span>
        {' · '}
        XP {entry.cumulativeXp.toLocaleString('ko-KR')} · 픽업 {entry.orderCount}회
      </span>
    )
  }

  const chipStyle = themed
    ? {
        color: tierColors.color,
        borderColor: tierColors.borderColor,
        backgroundColor: tierColors.backgroundColor,
      }
    : undefined

  const iconColor = themed ? tierColors.iconColor : undefined

  return (
    <div className={styles.grid}>
      <span
        className={`${styles.chip} ${themed ? styles.chipHighlight : ''}`}
        style={{
          ...(chipStyle ?? {}),
          ...(themed
            ? { boxShadow: tierTheme.myTierProgressGlow }
            : {
                color: tierColors.color,
                borderColor: tierColors.borderColor,
                backgroundColor: tierColors.backgroundColor,
              }),
        }}
      >
        <TierIcon label={entry.tierLabel} size="xs" glow alt="" />
        {entry.tierLabel}
      </span>
      {statItems.map(({ key, icon, label }) => (
        <span
          key={key}
          className={`${styles.chip} ${themed ? styles.chipThemed : ''}`}
          style={chipStyle}
        >
          <span
            className="material-symbols-outlined"
            style={iconColor ? { color: iconColor } : undefined}
          >
            {icon}
          </span>
          {label(entry)}
        </span>
      ))}
    </div>
  )
}
