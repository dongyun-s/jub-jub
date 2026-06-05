import { useMemo, useState } from 'react'
import { OwnerHeader } from '../../components/OwnerHeader'
import { Icon } from '../../components/Icon'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import SimpleAlertModal from '../../components/SimpleAlertModal/SimpleAlertModal'
import { useOwnerStoreDetail } from '../../hooks/useOwnerStoreDetail'
import { useOwnerReviews } from '../../hooks/useOwnerReviews'
import { formatReviewDate } from '../../lib/format'
import styles from './ReviewsPage.module.css'

export function ReviewsPage() {
  const { store, mockMode } = useOwnerStoreDetail()
  const { reviews, loading, error } = useOwnerReviews()
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((a, r) => a + r.overallRating, 0)
    return Math.round((sum / reviews.length) * 10) / 10
  }, [reviews])

  const sortedReviews = useMemo(
    () => [...reviews].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),
    [reviews],
  )

  const ratingBars = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]
    for (const r of reviews) {
      const idx = Math.min(5, Math.max(1, Math.round(r.overallRating))) - 1
      counts[idx] += 1
    }
    const total = reviews.length || 1
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      pct: `${Math.round((counts[star - 1]! / total) * 100)}%`,
    }))
  }, [reviews])

  const showReplySoon = () => {
    setAlertMessage(mockMode ? '답글 기능은 API 연동 후 제공됩니다. (예시 리뷰)' : '사장님 답글 기능은 준비 중입니다.')
    setAlertOpen(true)
  }

  return (
    <>
      <OwnerHeader title="리뷰관리" subtitle={mockMode ? `${store?.name ?? ''} · 예시 데이터` : store?.name} />
      <main className={styles.main}>
        <aside className={styles.summary}>
          <div className={styles.summaryHead}>
            <h2 className={styles.summaryKicker}>리뷰 요약</h2>
            <h3 className={styles.summaryTitle}>고객 리뷰</h3>
          </div>
          <div className={styles.scoreCard}>
            <div className={styles.scoreBig}>{loading ? '…' : avgRating > 0 ? avgRating.toFixed(1) : '—'}</div>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Icon key={i} name="star" filled={i <= Math.round(avgRating)} />
              ))}
            </div>
            <p className={styles.scoreMeta}>
              {loading ? '불러오는 중…' : `총 ${reviews.length.toLocaleString('ko-KR')}개의 리뷰`}
            </p>
          </div>
          {!loading && !error && reviews.length > 0 ? (
            <div className={styles.bars}>
              {ratingBars.map((r) => (
                <div key={r.star} className={styles.barRow}>
                  <span className={styles.barLabel}>{r.star}</span>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: r.pct }} />
                  </div>
                  <span className={styles.barPct}>{r.pct}</span>
                </div>
              ))}
            </div>
          ) : null}
          {error ? (
            <p className={styles.errorHint}>{error}</p>
          ) : mockMode ? (
            <div className={styles.insight}>
              <p className={styles.insightKicker}>예시 데이터</p>
              <p className={styles.insightBody}>실제 API 연동 시 고객 앱 리뷰가 표시됩니다.</p>
            </div>
          ) : null}
        </aside>

        <section className={styles.listSection}>
          <div className={styles.toolbar}>
            <div className={styles.filterBtns}>
              <button type="button" className={styles.filterActive}>
                전체 리뷰
              </button>
              <button type="button" className={styles.filterIdle}>
                미답변
              </button>
            </div>
          </div>

          <div className={styles.scroll}>
            {loading ? (
              <p className={styles.loadingHint}>리뷰를 불러오는 중…</p>
            ) : error ? (
              <EmptyState icon="rate_review" title="리뷰를 표시할 수 없습니다" description={error} />
            ) : sortedReviews.length === 0 ? (
              <EmptyState icon="reviews" title="아직 리뷰가 없습니다" description="첫 리뷰가 등록되면 여기에 표시됩니다." />
            ) : (
              sortedReviews.map((r, idx) => (
                <article
                  key={r.reviewId}
                  className={`${styles.reviewCard} ${idx === 0 && mockMode ? styles.reviewCardNew : ''}`}
                >
                  <div className={styles.reviewTop}>
                    <div className={styles.reviewAuthor}>
                      <div className={styles.avatarPlaceholder} />
                      <div>
                        <h4 className={styles.authorName}>
                          회원 #{r.memberProfileId}
                          {mockMode && idx === 0 ? <span className={styles.badge}> NEW</span> : null}
                        </h4>
                        <div className={styles.metaRow}>
                          <div className={styles.starRow}>
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Icon key={i} name="star" filled={i <= r.overallRating} />
                            ))}
                          </div>
                          <span className={styles.date}>{formatReviewDate(r.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.reviewBodyWrap}>
                    <p className={styles.reviewText}>{r.content || '(내용 없음)'}</p>
                    <div className={styles.replyRow}>
                      <button type="button" className={styles.btnReply} onClick={showReplySoon}>
                        <Icon name="reply" style={{ fontSize: '0.875rem' }} />
                        답글 달기
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>

      <button type="button" className={styles.fab} title="빠른 답글" onClick={showReplySoon}>
        <Icon name="auto_awesome" style={{ fontSize: '1.875rem' }} />
      </button>

      <SimpleAlertModal open={alertOpen} title="안내" message={alertMessage} variant="info" onClose={() => setAlertOpen(false)} />
    </>
  )
}
