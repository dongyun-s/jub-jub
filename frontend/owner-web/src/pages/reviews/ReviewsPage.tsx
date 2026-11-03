import { useEffect, useId, useMemo, useState } from 'react'
import { OwnerHeader } from '../../components/OwnerHeader'
import { Icon } from '../../components/Icon'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import AppModal from '../../components/AppModal/AppModal'
import mc from '../../components/AppModal/modalContent.module.css'
import SimpleAlertModal from '../../components/SimpleAlertModal/SimpleAlertModal'
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import { ApiError } from '../../api/authClient'
import {
  createOwnerReviewInsight,
  createOwnerReviewReply,
  deleteOwnerReviewReply,
  updateOwnerReviewReply,
  type OwnerReviewFilter,
  type OwnerReviewInsightDto,
  type OwnerReviewListItemDto,
} from '../../api/owner/review'
import { useOwnerStoreDetail } from '../../hooks/useOwnerStoreDetail'
import { useOwnerReviews } from '../../hooks/useOwnerReviews'
import { formatReviewDate } from '../../lib/format'
import { resolveDisplayImageUrl } from '../../lib/imageUrl'
import styles from './ReviewsPage.module.css'

const REPLY_MAX = 2000
const FILTERS: { key: OwnerReviewFilter; label: string }[] = [
  { key: 'ALL', label: '전체 리뷰' },
  { key: 'UNANSWERED', label: '미답변' },
  { key: 'PHOTO', label: '포토' },
]

type ReplyTarget = OwnerReviewListItemDto | null

export function ReviewsPage() {
  const { store, mockMode } = useOwnerStoreDetail()
  const [filter, setFilter] = useState<OwnerReviewFilter>('ALL')
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const { reviews, summary, loading, error, reload } = useOwnerReviews(filter, keyword)

  const [replyTarget, setReplyTarget] = useState<ReplyTarget>(null)
  const [replyText, setReplyText] = useState('')
  const [replySaving, setReplySaving] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const [insightOpen, setInsightOpen] = useState(false)
  const [insightLoading, setInsightLoading] = useState(false)
  const [insight, setInsight] = useState<OwnerReviewInsightDto | null>(null)
  const [insightReviewId, setInsightReviewId] = useState<number | null>(null)

  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertVariant, setAlertVariant] = useState<'info' | 'success' | 'error'>('info')

  const replyTitleId = useId()
  const insightTitleId = useId()

  useEffect(() => {
    const t = window.setTimeout(() => setKeyword(keywordInput.trim()), 300)
    return () => window.clearTimeout(t)
  }, [keywordInput])

  const avgRating = summary?.averageRating ?? 0
  const totalCount = summary?.totalReviewCount ?? reviews.length

  const sortedReviews = useMemo(
    () => [...reviews].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),
    [reviews],
  )

  const ratingBars = useMemo(() => {
    const d = summary?.ratingDistribution
    const counts = d
      ? [d.oneStar, d.twoStar, d.threeStar, d.fourStar, d.fiveStar]
      : [0, 0, 0, 0, 0]
    const total = Math.max(1, counts.reduce((a, b) => a + b, 0))
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      pct: `${Math.round((counts[star - 1]! / total) * 100)}%`,
    }))
  }, [summary])

  const showAlert = (message: string, variant: 'info' | 'success' | 'error' = 'info') => {
    setAlertMessage(message)
    setAlertVariant(variant)
    setAlertOpen(true)
  }

  const openReply = (r: OwnerReviewListItemDto) => {
    setReplyTarget(r)
    setReplyText(r.replyContent?.trim() ?? '')
  }

  const closeReply = () => {
    if (replySaving) return
    setReplyTarget(null)
    setReplyText('')
  }

  const saveReply = async () => {
    if (!replyTarget) return
    const content = replyText.trim()
    if (!content) {
      showAlert('답글 내용을 입력해 주세요.', 'error')
      return
    }
    if (content.length > REPLY_MAX) {
      showAlert(`답글은 최대 ${REPLY_MAX.toLocaleString('ko-KR')}자까지 작성할 수 있습니다.`, 'error')
      return
    }

    if (mockMode) {
      showAlert('예시 모드에서는 답글이 서버에 저장되지 않습니다.', 'info')
      closeReply()
      return
    }

    setReplySaving(true)
    try {
      if (replyTarget.answered) {
        await updateOwnerReviewReply(replyTarget.reviewId, content)
      } else {
        await createOwnerReviewReply(replyTarget.reviewId, content)
      }
      setReplyTarget(null)
      setReplyText('')
      await reload()
      showAlert(replyTarget.answered ? '답글을 수정했습니다.' : '답글을 등록했습니다.', 'success')
    } catch (e) {
      showAlert(e instanceof ApiError ? e.message : '답글을 저장하지 못했습니다.', 'error')
    } finally {
      setReplySaving(false)
    }
  }

  const confirmDeleteReply = async () => {
    if (!replyTarget) return
    setDeleteConfirmOpen(false)
    if (mockMode) {
      showAlert('예시 모드에서는 답글이 삭제되지 않습니다.', 'info')
      return
    }
    setReplySaving(true)
    try {
      await deleteOwnerReviewReply(replyTarget.reviewId)
      setReplyTarget(null)
      setReplyText('')
      await reload()
      showAlert('답글을 삭제했습니다.', 'success')
    } catch (e) {
      showAlert(e instanceof ApiError ? e.message : '답글을 삭제하지 못했습니다.', 'error')
    } finally {
      setReplySaving(false)
    }
  }

  const runInsight = async (reviewId: number) => {
    setInsightReviewId(reviewId)
    setInsight(null)
    setInsightOpen(true)
    if (mockMode) {
      setInsight({
        reviewId,
        summary: '고객은 전반적으로 만족했으며, 맛과 포장에 긍정적인 평가를 남겼습니다. (예시)',
        highlights: ['맛에 대한 만족도가 높습니다.', '포장·픽업 경험에 긍정 평가가 있습니다.'],
      })
      return
    }
    setInsightLoading(true)
    try {
      const data = await createOwnerReviewInsight(reviewId)
      setInsight(data)
    } catch (e) {
      setInsightOpen(false)
      showAlert(e instanceof ApiError ? e.message : 'AI 분석을 불러오지 못했습니다.', 'error')
    } finally {
      setInsightLoading(false)
    }
  }

  const fabInsight = () => {
    const target = sortedReviews.find((r) => !r.answered) ?? sortedReviews[0]
    if (!target) {
      showAlert('분석할 리뷰가 없습니다.', 'info')
      return
    }
    void runInsight(target.reviewId)
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
              {loading ? '불러오는 중…' : `총 ${totalCount.toLocaleString('ko-KR')}개의 리뷰`}
            </p>
            {summary && !loading ? (
              <div className={styles.statRow}>
                <span>미답변 {summary.unansweredReviewCount}</span>
                <span>포토 {summary.photoReviewCount}</span>
              </div>
            ) : null}
          </div>
          {!loading && !error && (summary || reviews.length > 0) ? (
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
              <p className={styles.insightBody}>실제 API 연동 시 사장님 매장 리뷰가 표시됩니다.</p>
            </div>
          ) : null}
        </aside>

        <section className={styles.listSection}>
          <div className={styles.toolbar}>
            <div className={styles.filterBtns}>
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={filter === f.key ? styles.filterActive : styles.filterIdle}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                  {f.key === 'UNANSWERED' && summary ? ` ${summary.unansweredReviewCount}` : ''}
                </button>
              ))}
            </div>
            <label className={styles.searchWrap}>
              <Icon name="search" style={{ fontSize: '1rem' }} />
              <input
                type="search"
                className={styles.searchInput}
                placeholder="리뷰·메뉴 검색"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
              />
            </label>
          </div>

          <div className={styles.scroll}>
            {loading ? (
              <p className={styles.loadingHint}>리뷰를 불러오는 중…</p>
            ) : error ? (
              <EmptyState icon="rate_review" title="리뷰를 표시할 수 없습니다" description={error} />
            ) : sortedReviews.length === 0 ? (
              <EmptyState
                icon="reviews"
                title={keyword || filter !== 'ALL' ? '조건에 맞는 리뷰가 없습니다' : '아직 리뷰가 없습니다'}
                description={
                  keyword || filter !== 'ALL'
                    ? '필터나 검색어를 바꿔 보세요.'
                    : '첫 리뷰가 등록되면 여기에 표시됩니다.'
                }
              />
            ) : (
              sortedReviews.map((r) => (
                <article key={r.reviewId} className={`${styles.reviewCard} ${!r.answered ? styles.reviewCardNew : ''}`}>
                  <div className={styles.reviewTop}>
                    <div className={styles.reviewAuthor}>
                      <div className={styles.avatarPlaceholder} />
                      <div>
                        <h4 className={styles.authorName}>
                          {r.reviewerName || '고객'}
                          {!r.answered ? <span className={styles.badge}>미답변</span> : null}
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
                    {r.imagePaths?.length ? (
                      <div className={styles.photoRow}>
                        {r.imagePaths.map((path) => {
                          const src = resolveDisplayImageUrl(path)
                          return src ? (
                            <img key={path} src={src} alt="" className={styles.photoThumb} loading="lazy" />
                          ) : null
                        })}
                      </div>
                    ) : null}
                    {r.answered && r.replyContent ? (
                      <div className={styles.ownerReply}>
                        <p className={styles.ownerReplyLabel}>사장님 답글</p>
                        <p className={styles.ownerReplyText}>{r.replyContent}</p>
                      </div>
                    ) : null}
                    <div className={styles.replyRow}>
                      <button type="button" className={styles.btnGhost} onClick={() => void runInsight(r.reviewId)}>
                        <Icon name="auto_awesome" style={{ fontSize: '0.875rem' }} />
                        AI 분석
                      </button>
                      <button type="button" className={styles.btnReply} onClick={() => openReply(r)}>
                        <Icon name="reply" style={{ fontSize: '0.875rem' }} />
                        {r.answered ? '답글 수정' : '답글 달기'}
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>

      <button type="button" className={styles.fab} title="AI 빠른 분석" onClick={fabInsight}>
        <Icon name="auto_awesome" style={{ fontSize: '1.875rem' }} />
      </button>

      <AppModal open={!!replyTarget} onClose={closeReply} size="md" aria-labelledby={replyTitleId}>
        <h2 id={replyTitleId} className={mc.titleLeft}>
          {replyTarget?.answered ? '답글 수정' : '답글 작성'}
        </h2>
        {replyTarget ? (
          <p className={styles.modalPreview}>{replyTarget.content || '(내용 없음)'}</p>
        ) : null}
        <textarea
          className={styles.replyTextarea}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value.slice(0, REPLY_MAX))}
          placeholder="고객에게 전달할 답글을 작성해 주세요."
          rows={5}
          disabled={replySaving}
        />
        <p className={styles.charCount}>
          {replyText.trim().length.toLocaleString('ko-KR')} / {REPLY_MAX.toLocaleString('ko-KR')}
        </p>
        <div className={styles.modalActions}>
          {replyTarget?.answered ? (
            <button
              type="button"
              className={styles.btnDangerText}
              disabled={replySaving}
              onClick={() => setDeleteConfirmOpen(true)}
            >
              답글 삭제
            </button>
          ) : (
            <span />
          )}
          <div className={styles.modalActionsRight}>
            <button type="button" className={mc.btnCancel} disabled={replySaving} onClick={closeReply}>
              취소
            </button>
            <button type="button" className={mc.btnPrimary} disabled={replySaving} onClick={() => void saveReply()}>
              {replySaving ? '저장 중…' : '저장'}
            </button>
          </div>
        </div>
      </AppModal>

      <ConfirmModal
        open={deleteConfirmOpen}
        title="답글 삭제"
        message="이 리뷰의 답글을 삭제할까요? 삭제 후 미답변으로 표시됩니다."
        confirmLabel="삭제"
        confirmTone="danger"
        confirmDisabled={replySaving}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => void confirmDeleteReply()}
      />

      <AppModal
        open={insightOpen}
        onClose={() => {
          if (!insightLoading) setInsightOpen(false)
        }}
        size="md"
        aria-labelledby={insightTitleId}
      >
        <h2 id={insightTitleId} className={mc.titleLeft}>
          AI 리뷰 분석
        </h2>
        {insightLoading ? (
          <p className={styles.loadingHint}>분석 중…</p>
        ) : insight ? (
          <div className={styles.insightModal}>
            <p className={styles.insightSummary}>{insight.summary}</p>
            {insight.highlights?.length ? (
              <ul className={styles.insightList}>
                {insight.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            ) : null}
            {insightReviewId != null ? (
              <p className={styles.insightMeta}>리뷰 #{insightReviewId}</p>
            ) : null}
          </div>
        ) : (
          <p className={styles.loadingHint}>분석 결과가 없습니다.</p>
        )}
        <div className={styles.modalActionsRight} style={{ marginTop: '1rem' }}>
          <button type="button" className={mc.btnPrimary} disabled={insightLoading} onClick={() => setInsightOpen(false)}>
            확인
          </button>
        </div>
      </AppModal>

      <SimpleAlertModal
        open={alertOpen}
        title="안내"
        message={alertMessage}
        variant={alertVariant}
        onClose={() => setAlertOpen(false)}
      />
    </>
  )
}
