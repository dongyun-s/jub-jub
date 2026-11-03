import { useState } from 'react'
import { Link } from 'react-router-dom'
import { OwnerHeader } from '../../components/OwnerHeader'
import { Icon } from '../../components/Icon'
import { useOwnerSales } from '../../context/OwnerSalesProvider'
import { useOwnerStoreDetail } from '../../hooks/useOwnerStoreDetail'
import styles from './StoreStatusPage.module.css'

const PRESET_MINUTES = [
  { label: '30분', minutes: 30 },
  { label: '1시간', minutes: 60 },
  { label: '2시간', minutes: 120 },
] as const

export function StoreStatusPage() {
  const { store, mockMode } = useOwnerStoreDetail()
  const {
    salesPaused,
    isScheduledPause,
    isIndefinitePause,
    resumeSales,
    pauseForMinutes,
    pauseIndefinitely,
    remainingMinutes,
    remainingMinutesLabel,
    formatResumeAtLabel,
  } = useOwnerSales()

  const [customMinutes, setCustomMinutes] = useState('60')

  const applyCustomPause = () => {
    const n = Number.parseInt(customMinutes, 10)
    if (!Number.isFinite(n) || n < 5) return
    pauseForMinutes(n)
  }

  const resumeAt = formatResumeAtLabel()
  const showCountdown =
    isScheduledPause && remainingMinutes != null && remainingMinutesLabel != null

  return (
    <>
      <OwnerHeader
        title="영업 상태"
        subtitle={mockMode ? `${store?.name ?? ''} · 예시 데이터` : store?.name}
      />
      <main className={styles.main}>
        <div className={styles.inner}>
          <section
            className={[styles.hero, salesPaused ? styles.heroPaused : styles.heroOpen].filter(Boolean).join(' ')}
            aria-live="polite"
          >
            <div className={styles.heroIconWrap}>
              <Icon name={salesPaused ? 'pause_circle' : 'storefront'} />
            </div>
            <div className={styles.heroText}>
              <p className={styles.heroKicker}>현재 상태</p>
              <h2 className={styles.heroTitle}>
                {salesPaused
                  ? isScheduledPause
                    ? '일시 중지'
                    : '영업 중지'
                  : '영업 중'}
              </h2>
              {showCountdown ? (
                <div className={styles.countdown} aria-live="polite">
                  <span className={styles.countdownNum}>{remainingMinutes}</span>
                  <span className={styles.countdownUnit}>분 남음</span>
                  {resumeAt ? (
                    <p className={styles.countdownSub}>{resumeAt}에 자동 재개</p>
                  ) : null}
                </div>
              ) : (
                <p className={styles.heroDesc}>
                  {salesPaused
                    ? '고객 앱에서 주문·픽업이 불가합니다. 영업을 재개하면 신규 주문을 받을 수 있습니다.'
                    : '고객이 메뉴를 보고 주문할 수 있습니다. 잠깐 쉬실 때는 일시 중지 시간을 지정하세요.'}
                </p>
              )}
            </div>
          </section>

          {salesPaused ? (
            <div className={styles.resumeBlock}>
              <button type="button" className={styles.resumeBtn} onClick={resumeSales}>
                <Icon name="play_circle" />
                지금 영업 재개
              </button>
              {isScheduledPause && remainingMinutesLabel ? (
                <p className={styles.resumeHint}>
                  {remainingMinutesLabel}
                  {resumeAt ? ` · ${resumeAt} 재개` : ''}
                </p>
              ) : isScheduledPause ? (
                <p className={styles.resumeHint}>예약된 시간에 자동으로 영업 중으로 전환됩니다.</p>
              ) : isIndefinitePause ? (
                <p className={styles.resumeHint}>무기한 중지 중입니다. 재개할 때까지 주문이 차단됩니다.</p>
              ) : null}
            </div>
          ) : (
            <>
              <section className={styles.panel} aria-labelledby="temp-pause-title">
                <h3 id="temp-pause-title" className={styles.panelTitle}>
                  <Icon name="schedule" />
                  일시 중지
                </h3>
                <p className={styles.panelDesc}>지정한 시간이 지나면 자동으로 영업 중으로 돌아갑니다.</p>
                <div className={styles.presetRow}>
                  {PRESET_MINUTES.map(({ label, minutes }) => (
                    <button
                      key={minutes}
                      type="button"
                      className={styles.presetBtn}
                      onClick={() => pauseForMinutes(minutes)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className={styles.customRow}>
                  <label className={styles.customLabel} htmlFor="pause-minutes">
                    직접 지정
                  </label>
                  <div className={styles.customInputWrap}>
                    <input
                      id="pause-minutes"
                      type="number"
                      min={5}
                      max={1440}
                      step={5}
                      className={styles.customInput}
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                    />
                    <span className={styles.customUnit}>분</span>
                    <button type="button" className={styles.customApply} onClick={applyCustomPause}>
                      적용
                    </button>
                  </div>
                </div>
              </section>

              <section className={styles.panelMuted} aria-labelledby="indef-pause-title">
                <h3 id="indef-pause-title" className={styles.panelTitleMuted}>
                  무기한 중지
                </h3>
                <p className={styles.panelDescMuted}>직접 재개할 때까지 주문 접수가 중단됩니다.</p>
                <button type="button" className={styles.indefBtn} onClick={pauseIndefinitely}>
                  <Icon name="block" />
                  영업 완전 중지
                </button>
              </section>
            </>
          )}

          <div className={styles.notes}>
            <p>
              <Icon name="info" style={{ fontSize: '1rem', verticalAlign: 'middle' }} /> 진행 중인 주문은{' '}
              <Link to="/orders">실시간 주문</Link>에서 계속 처리할 수 있습니다.
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
