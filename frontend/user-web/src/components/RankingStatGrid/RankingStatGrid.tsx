import { formatWalkingDistance } from '../../lib/rankingDisplay'
import styles from './RankingStatGrid.module.css'

export interface RankingStatGridProps {
  rankLabel: string
  walkingDistanceM: number
  orderCount: number
  tone?: 'onTier' | 'onWhite'
  compact?: boolean
  className?: string
}

export default function RankingStatGrid({
  rankLabel,
  walkingDistanceM,
  orderCount,
  tone = 'onWhite',
  compact = false,
  className = '',
}: RankingStatGridProps) {
  const toneClass = tone === 'onTier' ? styles.onTier : styles.onWhite

  return (
    <dl
      className={`${styles.grid} ${toneClass} ${compact ? styles.compact : ''} ${className}`.trim()}
    >
      <div className={styles.item}>
        <dt className={styles.label}>랭킹 순위</dt>
        <dd className={styles.value}>{rankLabel}</dd>
      </div>
      <div className={styles.item}>
        <dt className={styles.label}>누적 거리</dt>
        <dd className={styles.value}>{formatWalkingDistance(walkingDistanceM)}</dd>
      </div>
      <div className={styles.item}>
        <dt className={styles.label}>픽업 횟수</dt>
        <dd className={styles.value}>{orderCount.toLocaleString('ko-KR')}회</dd>
      </div>
    </dl>
  )
}
