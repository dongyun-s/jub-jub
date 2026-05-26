import type { MyRankingDto } from '../../api/ranking'
import TierBadge from '../TierBadge/TierBadge'
import { formatWalkingDistance } from '../../lib/rankingDisplay'
import styles from './MyRankingCard.module.css'

interface MyRankingCardProps {
  data: MyRankingDto | null
  loading?: boolean
  isMock?: boolean
}

function MyRankingCard({ data, loading, isMock }: MyRankingCardProps) {
  if (loading) {
    return (
      <section className={styles.card} aria-busy="true">
        <p className={styles.loading}>내 순위 불러오는 중…</p>
      </section>
    )
  }

  if (!data) return null

  const periodLabel = data.period === 'WEEKLY' ? '주간' : '전체'
  const rankText = data.isRanked
    ? `${data.rank}위`
    : '순위권 밖'

  return (
    <section className={styles.card} aria-label="내 랭킹">
      <div className={styles.header}>
        <span className={styles.badge}>{periodLabel} 내 순위</span>
        {isMock && <span className={styles.mockTag}>데모</span>}
      </div>
      <div className={styles.body}>
        <p className={styles.rank}>{rankText}</p>
        <p className={styles.meta}>
          {data.nickname} · 총 {data.totalParticipants.toLocaleString('ko-KR')}명 중
        </p>
        <div className={styles.stats}>
          <TierBadge label={data.tierLabel} variant="gradient" size="sm" />
          <span>{formatWalkingDistance(data.walkingDistanceM)}</span>
          <span>픽업 {data.orderCount}회</span>
        </div>
        {data.rankChange != null && data.rankChange !== 0 && (
          <p className={styles.change}>
            {data.rankChange > 0 ? `▲ ${data.rankChange}` : `▼ ${Math.abs(data.rankChange)}`} (전기 대비)
          </p>
        )}
      </div>
    </section>
  )
}

export default MyRankingCard
