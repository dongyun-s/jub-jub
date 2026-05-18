/**
 * RankingPage.tsx
 * 주간 회원 랭킹 (데모 데이터 — API 연동 전)
 */

import Layout from '../../components/Layout'
import BottomNav from '../../components/BottomNav'
import TierBadge, { getTierThemeForLabel } from '../../components/TierBadge/TierBadge'
import RankingMemberStats from '../../components/RankingMemberStats/RankingMemberStats'
import { getWeeklyRankingsByWalkingDistance, type RankingEntry } from '../../constants/ranking'
import { TIER_THEMES } from '../../lib/rewardTierTheme'
import styles from './RankingPage.module.css'

/** 히어로 배너 — 앱 기본(핑크) 그라데이션 고정 */
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

function PodiumCard({ entry, elevated }: { entry: RankingEntry; elevated?: boolean }) {
  const theme = getTierThemeForLabel(entry.tierLabel)
  return (
    <article
      className={`${styles.podiumCard} ${elevated ? styles.podiumCardFirst : ''}`}
      style={{
        ['--tier-ring' as string]: theme.myAvatarRing,
        ['--tier-glow' as string]: theme.myAvatarGlow,
        ['--tier-shadow' as string]: theme.gradeCardShadow,
      }}
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
        <div className={styles.podiumAvatarWrap} style={{ boxShadow: theme.myAvatarGlow }}>
          <img
            src={entry.avatarUrl}
            alt=""
            className={styles.podiumAvatar}
            style={{ borderColor: theme.myAvatarRing }}
          />
        </div>
        <p className={styles.podiumName} style={{ color: theme.badgeAccent }}>
          {entry.nickname}
        </p>
        <TierBadge label={entry.tierLabel} variant="gradient" size="md" className={styles.podiumTier} />
        <p className={styles.podiumXp} style={{ color: theme.badgeAccent }}>
          XP {entry.cumulativeXp.toLocaleString('ko-KR')}
        </p>
      </div>
    </article>
  )
}

function RankingRow({ entry }: { entry: RankingEntry }) {
  const theme = getTierThemeForLabel(entry.tierLabel)
  return (
    <article
      className={styles.card}
      style={{
        ['--tier-accent' as string]: theme.myGoalBadgeColor,
        ['--tier-ring' as string]: theme.myAvatarRing,
      }}
    >
      <div
        className={styles.cardAccent}
        style={{ backgroundImage: theme.gradeCardBackground }}
        aria-hidden
      />
      <span
        className={styles.rankBadge}
        style={{
          color: theme.myTierNameColor,
          backgroundColor: `${theme.myGoalBadgeColor}18`,
          borderColor: `${theme.myGoalBadgeColor}35`,
          boxShadow: theme.myTierProgressGlow,
        }}
      >
        {entry.rank}
      </span>
      <img
        src={entry.avatarUrl}
        alt=""
        className={styles.thumb}
        style={{
          borderColor: theme.myAvatarRing,
          boxShadow: theme.myAvatarGlow,
        }}
      />
      <div className={styles.info}>
        <div className={styles.nameRow}>
          <p className={styles.name} style={{ color: theme.myTierNameColor }}>
            {entry.nickname}
          </p>
          <TierBadge label={entry.tierLabel} variant="gradient" />
        </div>
        <RankingMemberStats entry={entry} themed />
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
  const rankings = getWeeklyRankingsByWalkingDistance()
  const top3 = rankings.filter((e) => e.rank <= 3)
  const rest = rankings.filter((e) => e.rank > 3)
  const podiumSecond = top3.find((e) => e.rank === 2)
  const podiumFirst = top3.find((e) => e.rank === 1)
  const podiumThird = top3.find((e) => e.rank === 3)

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
                <h2 className={styles.heroTitle}>이번 주 TOP 줍줍러</h2>
                <p className={styles.heroDesc}>누적 도보 이동 거리 기준 주간 회원 순위</p>
              </div>
              <span className={styles.heroBadge}>WEEKLY</span>
            </div>
          </section>

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
                  <RankingRow key={entry.rank} entry={entry} />
                ))}
              </div>
            </section>
          ) : null}

          <p className={styles.footerNote}>데모 데이터 · 누적 도보 거리순 · API 연동 후 실시간 반영</p>
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
