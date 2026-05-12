/**
 * 픽업 성공 시 지급되는 리워드 안내 모달
 */

import { useId } from 'react'
import AppModal from '../AppModal/AppModal'
import styles from './PickupRewardModal.module.css'

export interface PickupRewardBreakdown {
  xp: number
  /** 줄포인트 등 */
  points: number
  /** 연속 픽업 보너스 XP (0이면 행 숨김) */
  streakBonusXp?: number
  streakDays?: number
}

interface PickupRewardModalProps {
  open: boolean
  onClose: () => void
  storeName: string
  rewards?: PickupRewardBreakdown
  onWriteReview?: () => void
}

const defaultRewards: PickupRewardBreakdown = {
  xp: 50,
  points: 300,
  streakBonusXp: 10,
  streakDays: 3,
}

function PickupRewardModal({
  open,
  onClose,
  storeName,
  rewards = defaultRewards,
  onWriteReview,
}: PickupRewardModalProps) {
  const titleId = useId()
  const descId = useId()

  const showStreak =
    rewards.streakBonusXp != null &&
    rewards.streakBonusXp > 0 &&
    rewards.streakDays != null &&
    rewards.streakDays > 0

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
        리워드가 지급됐습니다.
      </p>

      <ul className={styles.rewardList}>
        <li className={styles.rewardRow}>
          <div className={styles.rewardIconWrap}>
            <span className={`material-symbols-outlined ${styles.rewardIcon}`} style={{ fontVariationSettings: "'FILL' 1" }}>
              star
            </span>
          </div>
          <div className={styles.rewardText}>
            <span className={styles.rewardLabel}>경험치</span>
            <span className={styles.rewardValue}>+{rewards.xp} XP</span>
          </div>
        </li>
        <li className={styles.rewardRow}>
          <div className={`${styles.rewardIconWrap} ${styles.rewardIconWrapPoints}`}>
            <span className={`material-symbols-outlined ${styles.rewardIcon}`}>savings</span>
          </div>
          <div className={styles.rewardText}>
            <span className={styles.rewardLabel}>줍 포인트</span>
            <span className={styles.rewardValue}>+{rewards.points.toLocaleString('ko-KR')} P</span>
          </div>
        </li>
        {showStreak && (
          <li className={`${styles.rewardRow} ${styles.rewardRowStreak}`}>
            <div className={`${styles.rewardIconWrap} ${styles.rewardIconWrapStreak}`}>
              <span className={`material-symbols-outlined ${styles.rewardIcon}`}>local_fire_department</span>
            </div>
            <div className={styles.rewardText}>
              <span className={styles.rewardLabel}>
                {rewards.streakDays}일 연속 픽업 보너스
              </span>
              <span className={styles.rewardValue}>+{rewards.streakBonusXp} XP</span>
            </div>
          </li>
        )}
      </ul>

      <div className={styles.actions}>
        {onWriteReview && (
          <button type="button" className={styles.btnSecondary} onClick={onWriteReview}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>
              rate_review
            </span>
            리뷰 남기기
          </button>
        )}
        <button type="button" className={styles.btnPrimary} onClick={onClose}>
          확인
        </button>
      </div>
    </AppModal>
  )
}

export default PickupRewardModal
