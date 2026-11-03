import TierBadge, { getTierThemeForLabel } from '../TierBadge/TierBadge'
import RankingEntryAvatar from '../RankingEntryAvatar/RankingEntryAvatar'
import RankingStatGrid from '../RankingStatGrid/RankingStatGrid'
import styles from './RankingMemberCard.module.css'

const rankMedalIcon: Record<number, string> = {
  1: 'emoji_events',
  2: 'workspace_premium',
  3: 'military_tech',
}

export interface RankingMemberCardProps {
  tierLabel: string
  nickname: string
  avatarUrl?: string
  rankLabel: string
  walkingDistanceM: number
  orderCount: number
  /** 상단 라벨 (예: 전체 내 순위) */
  headerBadge?: string
  /** 1~3위 메달 표시 */
  medalRank?: number
  highlight?: boolean
  footerNote?: string
  className?: string
}

export default function RankingMemberCard({
  tierLabel,
  nickname,
  avatarUrl,
  rankLabel,
  walkingDistanceM,
  orderCount,
  headerBadge,
  medalRank,
  highlight,
  footerNote,
  className = '',
}: RankingMemberCardProps) {
  const theme = getTierThemeForLabel(tierLabel)
  const showTop = Boolean(headerBadge || medalRank != null)

  return (
    <article
      className={`${styles.card} ${highlight ? styles.cardHighlight : ''} ${className}`.trim()}
      style={{
        backgroundImage: theme.gradeCardBackground,
        backgroundColor: 'transparent',
        boxShadow: theme.gradeCardShadow,
      }}
    >
      {showTop && (
        <div className={styles.cardTop}>
          <div className={styles.cardTopLeft}>
            {headerBadge ? <span className={styles.badge}>{headerBadge}</span> : null}
            {medalRank != null && medalRank >= 1 && medalRank <= 3 ? (
              <span className={styles.medal}>
                <span className="material-symbols-outlined">
                  {rankMedalIcon[medalRank] ?? 'tag'}
                </span>
                {medalRank}위
              </span>
            ) : null}
          </div>
        </div>
      )}

      <div className={styles.profileRow}>
        <RankingEntryAvatar imageUrl={avatarUrl} theme={theme} size="md" />
        <div className={styles.profileInfo}>
          <TierBadge label={tierLabel} variant="gradient" size="sm" />
          <p className={styles.nickname}>{nickname}</p>
        </div>
      </div>

      <RankingStatGrid
        rankLabel={rankLabel}
        walkingDistanceM={walkingDistanceM}
        orderCount={orderCount}
        tone="onTier"
      />

      {footerNote ? <p className={styles.footerNote}>{footerNote}</p> : null}
    </article>
  )
}
