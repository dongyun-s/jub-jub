import type { MyRankingDto } from '../../api/ranking'
import RankingMemberCard from '../RankingMemberCard/RankingMemberCard'
import { useProfile } from '../../hooks/useProfile'
import { resolveDisplayImageUrl } from '../../lib/imageUrl'
import { getTierTheme } from '../../lib/rewardTierTheme'
import styles from './MyRankingCard.module.css'

interface MyRankingCardProps {
  data: MyRankingDto | null
  loading?: boolean
}

function MyRankingCard({ data, loading }: MyRankingCardProps) {
  const { profile } = useProfile()
  const tierTheme = getTierTheme(data?.tierLabel ?? null, data?.tierLabel ?? null)

  const avatarResolved =
    (data?.avatarUrl?.trim() ? resolveDisplayImageUrl(data.avatarUrl.trim()) : '') ||
    (profile?.profileImagePath?.trim() ? resolveDisplayImageUrl(profile.profileImagePath.trim()) : '')

  const displayName =
    data?.nickname?.trim() ||
    profile?.nickname?.trim() ||
    profile?.name?.trim() ||
    '회원'

  if (loading) {
    return (
      <section
        className={styles.loadingCard}
        aria-busy="true"
        style={{
          backgroundImage: tierTheme.gradeCardBackground,
          backgroundColor: 'transparent',
          boxShadow: tierTheme.gradeCardShadow,
        }}
      >
        <p className={styles.loading}>내 순위 불러오는 중…</p>
      </section>
    )
  }

  if (!data) return null

  const rankLabel = data.isRanked ? `${data.rank}위` : '순위권 밖'
  const footerNote =
    !data.isRanked && data.totalParticipants > 0
      ? `총 ${data.totalParticipants.toLocaleString('ko-KR')}명 중`
      : undefined

  return (
    <div className={styles.wrap}>
      <RankingMemberCard
        tierLabel={data.tierLabel}
        nickname={displayName}
        avatarUrl={avatarResolved}
        rankLabel={rankLabel}
        walkingDistanceM={data.walkingDistanceM}
        orderCount={data.orderCount}
        headerBadge="전체 내 순위"
        footerNote={footerNote}
      />
    </div>
  )
}

export default MyRankingCard
