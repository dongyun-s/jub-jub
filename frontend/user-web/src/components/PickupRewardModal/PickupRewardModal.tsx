/**
 * 픽업 성공 시 서버 /rewards/me 기준으로 지급된 리워드 안내 모달
 */

import { useId } from 'react'
import AppModal from '../AppModal/AppModal'
import type { PickupRewardBreakdown } from '../../lib/pickupReward'
import { formatWalkedDistance } from '../../lib/pickupReward'
import TierIcon from '../TierIcon/TierIcon'
import styles from './PickupRewardModal.module.css'

interface PickupRewardModalProps {
  open: boolean
  onClose: () => void
  storeName: string
  loading?: boolean
  rewards?: PickupRewardBreakdown | null
  onWriteReview?: () => void
}

function PickupRewardModal({
  open,
  onClose,
  storeName,
  loading = false,
  rewards,
  onWriteReview,
}: PickupRewardModalProps) {
  const titleId = useId()
  const descId = useId()

  const showXp = rewards != null && rewards.earnedXp > 0
  const showDistance = rewards != null && rewards.walkedMeters > 0
  const showOrderCount = rewards != null && rewards.orderCountGain > 0

  return (
    <AppModal
      open={open}
      onClose={onClose}
      size="md"
      flush
      panelClassName={styles.surface}
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div className={styles.confetti} aria-hidden>
        <span className={styles.confettiPiece} />
        <span className={styles.confettiPiece} />
        <span className={styles.confettiPiece} />
        <span className={styles.confettiPiece} />
        <span className={styles.confettiPiece} />
        <span className={styles.confettiPiece} />
      </div>

      <div className={styles.glowOrb} aria-hidden />
      <div className={styles.glowOrbSecondary} aria-hidden />

      <div className={styles.badgeRing}>
        <div className={styles.badgeInner}>
          <span className={`material-symbols-outlined ${styles.badgeIcon}`}>redeem</span>
        </div>
      </div>

      <p className={styles.eyebrow}>PICKUP COMPLETE</p>
      <h2 id={titleId} className={styles.title}>
        픽업 완료!
      </h2>
      <p id={descId} className={styles.subtitle}>
        <span className={styles.storeName}>{storeName}</span>에서의 픽업이 확인되었어요.
        <br />
        {loading ? '리워드 반영 내역을 불러오는 중…' : '아래는 서버에 반영된 보상입니다.'}
      </p>

      {rewards?.tierUpgraded && rewards.previousTierName && !loading && (
        <p className={styles.tierUpgradeBanner}>
          <TierIcon tierName={rewards.tierName} size="sm" glow alt="" />
          {rewards.previousTierName} → {rewards.tierName} 등급 달성!
        </p>
      )}

      {loading ? (
        <div className={styles.loadingBox}>
          <span className={`material-symbols-outlined ${styles.loadingIcon}`}>progress_activity</span>
          <p>리워드 조회 중…</p>
        </div>
      ) : (
        <ul className={styles.rewardList}>
          {showXp && rewards && (
            <li className={styles.rewardRow}>
              <div className={styles.rewardIconWrap}>
                <span
                  className={`material-symbols-outlined ${styles.rewardIcon}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
              </div>
              <div className={styles.rewardText}>
                <span className={styles.rewardLabel}>경험치</span>
                <span className={styles.rewardValue}>+{rewards.earnedXp} XP</span>
              </div>
            </li>
          )}
          {showDistance && rewards && (
            <li className={styles.rewardRow}>
              <div className={`${styles.rewardIconWrap} ${styles.rewardIconWrapDistance}`}>
                <span className={`material-symbols-outlined ${styles.rewardIcon}`}>directions_walk</span>
              </div>
              <div className={styles.rewardText}>
                <span className={styles.rewardLabel}>이동 거리</span>
                <span className={styles.rewardValue}>+{formatWalkedDistance(rewards.walkedMeters)}</span>
              </div>
            </li>
          )}
          {showOrderCount && rewards && (
            <li className={styles.rewardRow}>
              <div className={`${styles.rewardIconWrap} ${styles.rewardIconWrapPickup}`}>
                <span className={`material-symbols-outlined ${styles.rewardIcon}`}>shopping_bag</span>
              </div>
              <div className={styles.rewardText}>
                <span className={styles.rewardLabel}>누적 픽업</span>
                <span className={styles.rewardValue}>
                  {rewards.totalOrderCount.toLocaleString('ko-KR')}회
                  <span className={styles.rewardSub}> (+{rewards.orderCountGain})</span>
                </span>
              </div>
            </li>
          )}
          {!showXp && !showDistance && !showOrderCount && (
            <li className={styles.rewardRowMuted}>
              <p>보상은 처리됐습니다. 홈·마이페이지에서 잠시 후 다시 확인해 주세요.</p>
            </li>
          )}
        </ul>
      )}

      <div className={styles.actions}>
        {onWriteReview && !loading && (
          <button type="button" className={styles.btnSecondary} onClick={onWriteReview}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>
              rate_review
            </span>
            리뷰 남기기
          </button>
        )}
        <button type="button" className={styles.btnPrimary} onClick={onClose} disabled={loading}>
          확인
        </button>
      </div>
    </AppModal>
  )
}

export default PickupRewardModal
