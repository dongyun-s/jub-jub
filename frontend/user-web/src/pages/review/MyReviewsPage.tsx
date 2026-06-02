/**
 * MyReviewsPage.tsx
 * 내 리뷰 관리 페이지 (마이페이지 → 리뷰 관리)
 * - GET /api/reviews/my/{memberProfileId}, DELETE /api/reviews/{reviewId}
 */

import { useCallback, useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import BottomNav from '../../components/BottomNav'
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import { ApiError } from '../../api/authClient'
import { deleteReview, fetchMyReviews, type ReviewDto, type ReviewWritePayload } from '../../api/reviews'
import { fetchStoreDetail } from '../../api/store'
import { useProfile } from '../../hooks/useProfile'
import { getAccessToken, getCachedMemberProfileId } from '../../lib/authStorage'
import { storeCardImageById } from '../../constants'
import { normalizeReviewImageList, resolveDisplayImageUrl } from '../../lib/imageUrl'
import styles from './MyReviewsPage.module.css'

interface MyReviewsPageProps {
  onBack?: () => void
  onBackToMypage?: () => void
  onWriteReview?: () => void
  onEditReview?: (payload: ReviewWritePayload) => void
  onGoHome?: () => void
  onCartClick?: () => void
  onOrdersClick?: () => void
  onMapClick?: () => void
  onMypageClick?: () => void
  cartCount?: number
}

interface ReviewUi {
  id: number
  orderId: number
  storeId: number
  storeName: string
  storeImage: string
  rating: number
  date: string
  content: string
  photos: string[]
  keywords: string[]
}

function formatReviewDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10)
  const yy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yy}.${mm}.${dd}`
}

function storeThumb(storeId: number): string {
  return (
    storeCardImageById(storeId)
  )
}

function mapDtoToUi(d: ReviewDto, storeName: string): ReviewUi {
  const rawPaths = normalizeReviewImageList(d as unknown as Record<string, unknown>)
  const urls = rawPaths
    .map((p) => {
      const u = resolveDisplayImageUrl(p)
      return (u && u.length > 0 ? u : p) as string
    })
    .filter((u): u is string => typeof u === 'string' && u.length > 0)
  const kw: string[] = []
  if (d.aiGeneratedHelped) kw.push('AI 도움 받음')
  return {
    id: d.reviewId,
    orderId: d.orderId,
    storeId: d.storeId,
    storeName,
    storeImage: storeThumb(d.storeId),
    rating: d.overallRating,
    date: formatReviewDate(d.createdAt),
    content: d.content,
    photos: urls,
    keywords: kw,
  }
}

function MyReviewsPage({
  onBack,
  onBackToMypage,
  onWriteReview,
  onEditReview,
  onGoHome,
  onCartClick,
  onOrdersClick,
  onMapClick,
  onMypageClick,
  cartCount = 0,
}: MyReviewsPageProps) {
  const { profile } = useProfile()
  const [reviews, setReviews] = useState<ReviewUi[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadReviews = useCallback(async () => {
    if (!getAccessToken()) {
      setReviews([])
      setLoadError('로그인이 필요합니다.')
      setLoading(false)
      return
    }
    const mpid = profile?.memberProfileId ?? getCachedMemberProfileId()
    if (mpid == null) {
      setReviews([])
      setLoadError('프로필 정보를 불러오지 못했습니다. 주문을 한 번 생성(결제 진행)한 뒤 다시 시도해 주세요.')
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError(null)
    try {
      const list = await fetchMyReviews(Number(mpid))
      const ids = [...new Set(list.map((r) => r.storeId))]
      const nameByStore: Record<number, string> = {}
      await Promise.all(
        ids.map(async (sid) => {
          try {
            const det = await fetchStoreDetail(sid)
            nameByStore[sid] = det.name
          } catch {
            nameByStore[sid] = `매장 #${sid}`
          }
        }),
      )
      setReviews(list.map((r) => mapDtoToUi(r, nameByStore[r.storeId] ?? `매장 #${r.storeId}`)))
    } catch (e) {
      setReviews([])
      setLoadError(e instanceof ApiError ? e.message : '리뷰 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [profile?.memberProfileId])

  useEffect(() => {
    void loadReviews()
  }, [loadReviews])

  const handleEditClick = (review: ReviewUi) => {
    onEditReview?.({
      reviewId: review.id,
      orderId: review.orderId,
      storeId: review.storeId,
      storeName: review.storeName,
    })
  }

  const handleDeleteClick = (id: number) => {
    setSelectedReviewId(id)
    setShowDeleteModal(true)
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
      return
    }
    if (onBackToMypage) {
      onBackToMypage()
      return
    }
    onGoHome?.()
  }

  const handleDeleteConfirm = () => {
    const mpid = profile?.memberProfileId ?? getCachedMemberProfileId()
    if (selectedReviewId === null || mpid == null) {
      setShowDeleteModal(false)
      return
    }
    setDeleting(true)
    void (async () => {
      try {
        await deleteReview(selectedReviewId, { memberProfileId: Number(mpid) })
        await loadReviews()
      } catch (e) {
        alert(e instanceof ApiError ? e.message : '삭제하지 못했습니다.')
      } finally {
        setDeleting(false)
        setShowDeleteModal(false)
        setSelectedReviewId(null)
      }
    })()
  }

  const renderStars = (rating: number) => {
    return (
      <div className={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`material-symbols-outlined ${styles.starIcon} ${star <= rating ? styles.starOn : styles.starOff}`}
          >
            star
          </span>
        ))}
      </div>
    )
  }

  return (
    <Layout showBackground={false}>
      <div className={styles.root}>
        <header className={styles.header}>
          <button type="button" onClick={handleBack} className={styles.backButton} aria-label="뒤로 가기">
            <span className={`material-symbols-outlined ${styles.backIcon}`}>arrow_back</span>
          </button>
          <h1 className={styles.headerTitle}>리뷰 관리</h1>
        </header>

        <div className={styles.scrollArea}>
          {loading ? (
            <section className={styles.emptySection}>
              <div className={styles.emptyCardCompact}>
                <span className={`material-symbols-outlined ${styles.emptyIconMuted}`}>hourglass_empty</span>
                <p className={styles.emptyStatusText}>리뷰 목록을 불러오는 중이에요…</p>
              </div>
            </section>
          ) : loadError ? (
            <section className={styles.emptySection}>
              <div className={styles.emptyCardCompact}>
                <span className={`material-symbols-outlined ${styles.emptyIconError}`}>error</span>
                <p className={styles.emptyStatusText}>{loadError}</p>
              </div>
            </section>
          ) : reviews.length > 0 ? (
            <section className={styles.listSection}>
              <div className={styles.list}>
                {reviews.map((review) => (
                  <div key={review.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <img src={review.storeImage} alt={review.storeName} className={styles.cardImage} />
                      <div className={styles.cardInfo}>
                        <h3 className={styles.cardStoreName}>{review.storeName}</h3>
                        <div className={styles.cardMeta}>
                          {renderStars(review.rating)}
                          <span className={styles.cardDate}>{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className={styles.cardContent}>{review.content}</p>
                    {review.photos.length > 0 && (
                      <div className={styles.cardPhotos}>
                        {review.photos.map((photo, idx) => (
                          <img key={idx} src={photo} alt={`리뷰 사진 ${idx + 1}`} className={styles.cardPhoto} />
                        ))}
                      </div>
                    )}
                    {review.keywords.length > 0 && (
                      <div className={styles.cardKeywords}>
                        {review.keywords.map((keyword) => (
                          <span key={keyword} className={styles.keyword}>
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className={styles.actionButton}
                        onClick={() => handleEditClick(review)}
                      >
                        <span className={`material-symbols-outlined ${styles.actionIcon}`}>edit</span>
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(review.id)}
                        className={`${styles.actionButton} ${styles.actionButtonDelete}`}
                      >
                        <span className={`material-symbols-outlined ${styles.actionIcon}`}>delete</span>
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className={styles.emptySection} aria-labelledby="reviews-empty-title">
              <div className={styles.emptyCard}>
                <div className={styles.emptyIconWrap} aria-hidden>
                  <span className={`material-symbols-outlined ${styles.emptyIcon}`}>rate_review</span>
                </div>
                <h2 id="reviews-empty-title" className={styles.emptyTitle}>
                  아직 남긴 리뷰가 없어요
                </h2>
                <p className={styles.emptyLead}>
                  픽업을 완료한 주문은
                  <br />
                  <strong className={styles.emptyLeadStrong}>주문 내역</strong>에서 리뷰를 작성할 수 있어요.
                </p>
                <ul className={styles.emptySteps}>
                  <li>
                    <span className={styles.emptyStepNum}>1</span>
                    <span>주문 내역에서 픽업 완료 주문을 찾아요</span>
                  </li>
                  <li>
                    <span className={styles.emptyStepNum}>2</span>
                    <span>리뷰 쓰기를 눌러 별점과 한 줄평을 남겨요</span>
                  </li>
                </ul>
                <p className={styles.emptyFootnote}>맛집 경험을 공유하면 다른 회원에게도 도움이 돼요.</p>
                <div className={styles.emptyActions}>
                  <button type="button" onClick={onWriteReview} className={styles.emptyCta}>
                    주문 내역으로 이동
                  </button>
                  <button
                    type="button"
                    onClick={onBackToMypage ?? onBack}
                    className={styles.emptySecondary}
                  >
                    마이페이지로 돌아가기
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>

        <ConfirmModal
          open={showDeleteModal}
          title="리뷰 삭제"
          message={'정말 이 리뷰를 삭제하시겠어요?\n삭제된 리뷰는 복구할 수 없습니다.'}
          confirmLabel={deleting ? '삭제 중…' : '삭제'}
          confirmTone="danger"
          confirmDisabled={deleting}
          cancelDisabled={deleting}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
        />

        <BottomNav
          active="mypage"
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

export default MyReviewsPage
