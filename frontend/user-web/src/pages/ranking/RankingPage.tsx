/**
 * RankingPage.tsx — 전체 누적 랭킹 + 내 순위
 */

import Layout from '../../components/Layout'
import BottomNav from '../../components/BottomNav'
import TierBadge, { getTierThemeForLabel } from '../../components/TierBadge/TierBadge'
import RankingEntryAvatar from '../../components/RankingEntryAvatar/RankingEntryAvatar'
import RankingMemberCard from '../../components/RankingMemberCard/RankingMemberCard'
import MyRankingCard from '../../components/MyRankingCard/MyRankingCard'
import type { RankingEntryDto } from '../../api/ranking'
import { useMyRanking } from '../../hooks/useMyRanking'
import { useRankings } from '../../hooks/useRankings'
import { formatWalkingDistance } from '../../lib/rankingDisplay'
import { TIER_THEMES } from '../../lib/rewardTierTheme'
import styles from './RankingPage.module.css'

const HERO_THEME = TIER_THEMES.default

interface RankingPageProps {
  onBack?: () => void
  onGoHome?: () => void
  onCartClick?: () => void
  onOrdersClick?: () => void
  onMapClick?: () => void
  onMypageClick?: () => void
  cartCount?: number
}

const rankMedalIcon: Record<number, string> = {
  1: 'emoji_events',
  2: 'workspace_premium',
  3: 'military_tech',
}

/** 명예의 전당 — 3열 포디엄용 컴팩트 카드 (좁은 칸에 맞게 세로 통계) */
function PodiumCard({ entry, elevated }: { entry: RankingEntryDto; elevated?: boolean }) {
  const theme = getTierThemeForLabel(entry.tierLabel)
  return (
    <article
      className={`${styles.podiumCard} ${elevated ? styles.podiumCardFirst : ''}`}
    >
      <div
        className={styles.podiumCardBg}
        style={{
          backgroundImage: theme.gradeCardBackground,
          boxShadow: theme.gradeCardShadow,
        }}
        aria-hidden
      />
      <div className={styles.podiumCardInner}>
        <span className={styles.podiumRank} style={{ color: theme.badgeAccent }}>
          <span className="material-symbols-outlined">{rankMedalIcon[entry.rank] ?? 'tag'}</span>
          {entry.rank}위
        </span>
        <RankingEntryAvatar
          imageUrl={entry.avatarUrl}
          theme={theme}
          size={elevated ? 'podiumElevated' : 'podium'}
          className={styles.podiumAvatar}
        />
        <TierBadge label={entry.tierLabel} variant="gradient" size="sm" className={styles.podiumTier} />
        <p className={styles.podiumName}>{entry.nickname}</p>
        <dl className={styles.podiumStats}>
          <div className={styles.podiumStatRow}>
            <dt>순위</dt>
            <dd>{entry.rank}위</dd>
          </div>
          <div className={styles.podiumStatRow}>
            <dt>거리</dt>
            <dd>{formatWalkingDistance(entry.walkingDistanceM)}</dd>
          </div>
          <div className={styles.podiumStatRow}>
            <dt>픽업</dt>
            <dd>{entry.orderCount}회</dd>
          </div>
        </dl>
      </div>
    </article>
  )
}

function RankingPage({
  onBack,
  onGoHome,
  onCartClick,
  onOrdersClick,
  onMapClick,
  onMypageClick,
  cartCount = 0,
}: RankingPageProps) {
  const { entries, totalUsers, loading, error } = useRankings()
  const { myRanking, loading: myLoading } = useMyRanking()

  const top3 = entries.filter((e) => e.rank <= 3)
  const rest = entries.filter((e) => e.rank > 3)
  const podiumFirst = top3.find((e) => e.rank === 1)
  const podiumSecond = top3.find((e) => e.rank === 2)
  const podiumThird = top3.find((e) => e.rank === 3)

  const heroTitle = '전체 누적 TOP 줍줍러'
  const heroDesc = '누적 도보 이동 거리 기준 전체 회원 순위'

  return (
    <Layout showBackground={false}>
      <div className={styles.root}>
        <header className={styles.header}>
          <button type="button" onClick={() => onBack?.()} className={styles.backButton} aria-label="뒤로">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className={styles.headerTitle}>회원 랭킹</h1>
        </header>

        <div className={styles.scrollArea}>
          <section
            className={styles.hero}
            style={{
              backgroundImage: HERO_THEME.gradeCardBackground,
              boxShadow: HERO_THEME.gradeCardShadow,
            }}
          >
            <div className={styles.heroShine} aria-hidden />
            <div className={styles.heroContent}>
              <span className={styles.heroIconWrap}>
                <span className="material-symbols-outlined">leaderboard</span>
              </span>
              <div>
                <h2 className={styles.heroTitle}>{heroTitle}</h2>
                <p className={styles.heroDesc}>{heroDesc}</p>
              </div>
              <span className={styles.heroBadge}>ALL</span>
            </div>
          </section>

          <MyRankingCard data={myRanking} loading={myLoading} />

          {loading && (
            <p className={styles.loadingMessage}>랭킹을 불러오는 중…</p>
          )}

          {!loading && entries.length > 0 && (
            <>
              <section className={styles.podiumSection} aria-label="상위 3명">
                <h3 className={styles.sectionLabel}>
                  <span className="material-symbols-outlined">stars</span>
                  명예의 전당
                </h3>
                <div className={styles.podium}>
                  {podiumSecond ? <PodiumCard entry={podiumSecond} /> : <div className={styles.podiumSpacer} />}
                  {podiumFirst ? <PodiumCard entry={podiumFirst} elevated /> : null}
                  {podiumThird ? <PodiumCard entry={podiumThird} /> : <div className={styles.podiumSpacer} />}
                </div>
              </section>

              {rest.length > 0 ? (
                <section className={styles.listSection} aria-label="4위 이하">
                  <h3 className={styles.sectionLabel}>
                    <span className="material-symbols-outlined">format_list_numbered</span>
                    전체 순위
                  </h3>
                  <div className={styles.list}>
                    {rest.map((entry) => (
                      <RankingMemberCard
                        key={entry.rank}
                        tierLabel={entry.tierLabel}
                        nickname={entry.nickname}
                        avatarUrl={entry.avatarUrl}
                        rankLabel={`${entry.rank}위`}
                        walkingDistanceM={entry.walkingDistanceM}
                        orderCount={entry.orderCount}
                      />
                    ))}

                  </div>
                </section>
              ) : null}
            </>
          )}

          <p className={styles.footerNote}>
            {`실시간 랭킹 · 총 ${totalUsers.toLocaleString('ko-KR')}명`}
            {error ? ` · ${error}` : ''}
          </p>
        </div>

        <BottomNav
          active="home"
          cartCount={cartCount}
          onNavigate={(page) => {
            if (page === 'home') onGoHome?.()
            if (page === 'cart') onCartClick?.()
            if (page === 'orders') onOrdersClick?.()
            if (page === 'map') onMapClick?.()
            if (page === 'mypage') onMypageClick?.()
          }}
        />
      </div>
    </Layout>
  )
}

export default RankingPage
