/**
 * 출석 7회 달성 랜덤박스 — 상자 3개 중 선택 연출 (당첨은 서버·쿠폰함 기준)
 */

import { useEffect, useState } from 'react'
import AppModal from '../AppModal/AppModal'
import {
  prizeLabel,
  resolveAttendanceBoxPrizeFromCoupons,
  type AttendanceBoxPrize,
} from '../../lib/attendanceRandomBox'
import styles from './AttendanceRandomBoxModal.module.css'

type Phase = 'pick' | 'opening' | 'result'

const ALL_BOX_PRIZES: AttendanceBoxPrize[] = ['1000', '100', 'NONE']

interface AttendanceRandomBoxModalProps {
  open: boolean
  couponIdsBefore: Set<number>
  onClose: () => void
  onGoCoupons?: () => void
  /** [개발·미리보기] 설정 시 쿠폰 API 대신 고정 결과로 연출 */
  devMockPrize?: AttendanceBoxPrize | null
}

function decoyLabel(prize: AttendanceBoxPrize): string {
  if (prize === '1000') return '1,000원'
  if (prize === '100') return '100원'
  return '꽝'
}

/** 선택하지 않은 상자 2개 — 당첨과 다른 나머지 보상을 각각 1개씩 표시 */
function decoyForBox(boxIndex: number, selected: number, prize: AttendanceBoxPrize): string {
  if (boxIndex === selected) return ''
  const others = ALL_BOX_PRIZES.filter((p) => p !== prize)
  const unselected = [0, 1, 2].filter((i) => i !== selected)
  const slot = unselected.indexOf(boxIndex)
  return decoyLabel(others[slot] ?? 'NONE')
}

export default function AttendanceRandomBoxModal({
  open,
  couponIdsBefore,
  onClose,
  onGoCoupons,
  devMockPrize = null,
}: AttendanceRandomBoxModalProps) {
  const [phase, setPhase] = useState<Phase>('pick')
  const [selectedBox, setSelectedBox] = useState<number | null>(null)
  const [prize, setPrize] = useState<AttendanceBoxPrize | null>(null)

  useEffect(() => {
    if (!open) return
    setPhase('pick')
    setSelectedBox(null)
    setPrize(null)
  }, [open])

  const handlePick = (index: number) => {
    if (phase !== 'pick') return
    setSelectedBox(index)
    setPhase('opening')
    void (async () => {
      await new Promise((r) => setTimeout(r, 700))
      if (devMockPrize != null) {
        setPrize(devMockPrize)
      } else {
        try {
          const resolved = await resolveAttendanceBoxPrizeFromCoupons(couponIdsBefore)
          setPrize(resolved)
        } catch {
          setPrize('NONE')
        }
      }
      setPhase('result')
    })()
  }

  const handleClose = () => {
    onClose()
  }

  const handleCoupons = () => {
    onGoCoupons?.()
    onClose()
  }

  const resultMessage =
    prize === '1000'
      ? '축하해요! 1,000원 쿠폰이 쿠폰함에 들어갔어요.'
      : prize === '100'
        ? '100원 쿠폰이 쿠폰함에 들어갔어요.'
        : '이번엔 꽝이에요. 다음 7회 출석 때 다시 도전해 보세요!'

  return (
    <AppModal
      open={open}
      onClose={phase === 'opening' ? () => {} : handleClose}
      size="md"
      closeOnBackdrop={phase === 'pick' || phase === 'result'}
      aria-labelledby="attendance-random-box-title"
    >
      <div className={styles.inner}>
        {phase === 'opening' && (
          <div className={styles.opening}>
            <span className={`material-symbols-outlined ${styles.spin}`}>sync</span>
            상자를 여는 중…
          </div>
        )}

        {phase === 'pick' && (
          <>
            <h3 id="attendance-random-box-title" className={styles.title}>
              랜덤박스를 열어보세요!
            </h3>
            <p className={styles.subtitle}>
              누적 7회 출석 달성! 상자 3개 중 마음에 드는 하나를 골라 주세요.
            </p>
            <div className={styles.boxRow}>
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  type="button"
                  className={styles.boxBtn}
                  onClick={() => handlePick(i)}
                  aria-label={`상자 ${i + 1}번 선택`}
                >
                  <div className={`${styles.boxShell} ${styles.boxShellIdle}`}>
                    <span className={styles.boxIcon} aria-hidden>
                      🎁
                    </span>
                    <span className={styles.boxLabel}>BOX {i + 1}</span>
                  </div>
                </button>
              ))}
            </div>
            <p className={styles.hint}>탭해서 상자를 선택하세요</p>
          </>
        )}

        {phase === 'result' && prize != null && selectedBox != null && (
          <>
            <h3 id="attendance-random-box-title" className={styles.title}>
              {prize === 'NONE' ? '아쉬워요…' : `${prizeLabel(prize)} 당첨!`}
            </h3>
            <p className={styles.subtitle}>{resultMessage}</p>
            <div className={styles.boxRow}>
              {[0, 1, 2].map((i) => {
                const isSelected = i === selectedBox
                const decoy = decoyForBox(i, selectedBox, prize)
                return (
                  <div key={i} className={styles.boxBtn} style={{ pointerEvents: 'none' }}>
                    <div
                      className={[
                        styles.boxShell,
                        isSelected ? styles.boxShellSelected : styles.boxShellDim,
                        isSelected && prize !== 'NONE' ? styles.boxShellWin : '',
                        isSelected && prize === 'NONE' ? styles.boxShellLose : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <span className={styles.boxIcon} aria-hidden>
                        {isSelected ? (prize === 'NONE' ? '💨' : '🎉') : '📦'}
                      </span>
                      {isSelected ? (
                        prize === 'NONE' ? (
                          <span className={styles.prizeMiss}>꽝</span>
                        ) : (
                          <span className={styles.prizeAmount}>{prizeLabel(prize)}</span>
                        )
                      ) : (
                        <span
                          className={
                            decoy === '꽝' ? styles.prizeMiss : styles.prizeDecoy
                          }
                        >
                          {decoy}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className={styles.actions}>
              {prize !== 'NONE' ? (
                <button type="button" className={styles.primaryBtn} onClick={handleCoupons}>
                  쿠폰함에서 확인
                </button>
              ) : null}
              <button
                type="button"
                className={prize !== 'NONE' ? styles.secondaryBtn : styles.primaryBtn}
                onClick={handleClose}
              >
                확인
              </button>
            </div>
          </>
        )}
      </div>
    </AppModal>
  )
}
