/**
 * ReviewWritePage.tsx
 * 리뷰 작성 페이지 (주문내역에서 '리뷰 쓰기' 클릭 시)
 * - 매장명, 별점(음식/가격/픽업경험), 사진, 한줄평, 추천 키워드, AI 리뷰 도움 모달
 */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Layout from '../../components/Layout'
import BottomNav from '../../components/BottomNav'
import AppModal from '../../components/AppModal/AppModal'
import { ApiError } from '../../api/authClient'
import { assertImageFileConstraints, MAX_REVIEW_IMAGES, uploadImageFileViaPresigned } from '../../api/uploads'
import { createReview, generateAiReview } from '../../api/reviews'
import { useProfile } from '../../hooks/useProfile'
import { resolveMemberProfileIdForReview } from '../../lib/authStorage'
import styles from './ReviewWritePage.module.css'

interface ReviewWritePageProps {
  storeName?: string
  orderId: number
  storeId: number
  onBack?: () => void
  /** 서버 등록 성공 후 */
  onSubmitted?: () => void
  onGoHome?: () => void
  onCartClick?: () => void
  onOrdersClick?: () => void
  onMapClick?: () => void
  onMypageClick?: () => void
  cartCount?: number
}

/** 추천 키워드 버튼 목록 */
const recommendKeywords = [
  { icon: '✨', label: '분위기가 좋아요' },
  { icon: '☕', label: '커피가 맛있어요' },
  { icon: '🧁', label: '디저트 맛집' },
  { icon: '💻', label: '작업하기좋아요' },
]

/** 별점 1~5에 대응하는 라벨 (AI 평가용) */
const ratingLabels: Record<number, string> = {
  1: '별로예요',
  2: '그저그래요',
  3: '괜찮아요',
  4: '좋아요',
  5: '탁월해요',
}

const getRatingLabel = (rating: number, category: string) => {
  if (category === '픽업 경험' && rating === 5) return '만족스러워요'
  return ratingLabels[rating] || ''
}

function ReviewWritePage({ 
  storeName = '카페 네온 하이브',
  orderId,
  storeId,
  onBack,
  onSubmitted,
  onGoHome,
  onCartClick,
  onOrdersClick,
  onMapClick,
  onMypageClick,
  cartCount = 0
}: ReviewWritePageProps) {
  const { profile } = useProfile()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const pendingPhotosRef = useRef<{ previewUrl: string }[]>([])
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  /** 로컬 미리보기 + 업로드용 File (제출 시 S3 presigned → fileUrl 수집) */
  const [pendingPhotos, setPendingPhotos] = useState<{ file: File; previewUrl: string }[]>([])
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [usedAiAssist, setUsedAiAssist] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [photoPreviewIndex, setPhotoPreviewIndex] = useState<number | null>(null)
  
  // AI 모달 관련 상태
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiRatings, setAiRatings] = useState({
    taste: 0,
    packaging: 0,
    pickup: 0,
  })

  const handleStarClick = (star: number) => {
    setRating(star)
  }

  const handleKeywordToggle = (keyword: string) => {
    setSelectedKeywords(prev => 
      prev.includes(keyword) 
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    )
  }

  useEffect(() => {
    pendingPhotosRef.current = pendingPhotos
  }, [pendingPhotos])

  useEffect(() => {
    return () => {
      for (const p of pendingPhotosRef.current) {
        URL.revokeObjectURL(p.previewUrl)
      }
    }
  }, [])

  useEffect(() => {
    if (photoPreviewIndex === null) return
    const len = pendingPhotos.length
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPhotoPreviewIndex(null)
        return
      }
      if (len <= 1) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setPhotoPreviewIndex((i) => (i === null ? null : (i - 1 + len) % len))
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setPhotoPreviewIndex((i) => (i === null ? null : (i + 1) % len))
      }
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [photoPreviewIndex, pendingPhotos.length])

  useEffect(() => {
    if (pendingPhotos.length === 0) setPhotoPreviewIndex(null)
    else if (photoPreviewIndex !== null && photoPreviewIndex >= pendingPhotos.length) {
      setPhotoPreviewIndex(pendingPhotos.length - 1)
    }
  }, [pendingPhotos.length, photoPreviewIndex])

  const handlePhotoFiles = (list: FileList | null) => {
    if (!list?.length) return
    setPendingPhotos((prev) => {
      const next = [...prev]
      for (let i = 0; i < list.length; i++) {
        if (next.length >= MAX_REVIEW_IMAGES) {
          alert(`사진은 최대 ${MAX_REVIEW_IMAGES}장까지 추가할 수 있습니다.`)
          break
        }
        const file = list[i]
        try {
          assertImageFileConstraints(file)
        } catch (e) {
          alert(e instanceof ApiError ? e.message : '이미지를 추가할 수 없습니다.')
          continue
        }
        next.push({ file, previewUrl: URL.createObjectURL(file) })
      }
      return next
    })
  }

  const handleRemovePhoto = (index: number) => {
    setPendingPhotos((prev) => {
      const row = prev[index]
      if (row) URL.revokeObjectURL(row.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleAIGenerate = () => {
    const draft = content.trim()

    void (async () => {
      setAiGenerating(true)
      try {
        if (draft) {
          /** 초안 부풀리기 — 명세: 별점은 0, content에 초안 */
          const res = await generateAiReview({
            packagingRating: 0,
            tasteRating: 0,
            timeRating: 0,
            content: draft,
          })
          setContent(res.generatedReview)
          setUsedAiAssist(true)
          setShowAIModal(false)
          return
        }

        if (aiRatings.taste === 0 || aiRatings.packaging === 0 || aiRatings.pickup === 0) {
          alert('모든 항목의 별점을 선택해주세요.')
          return
        }

        const res = await generateAiReview({
          packagingRating: aiRatings.packaging,
          tasteRating: aiRatings.taste,
          timeRating: aiRatings.pickup,
          content: '',
        })
        setContent(res.generatedReview)
        const avgRating = Math.round((aiRatings.taste + aiRatings.packaging + aiRatings.pickup) / 3)
        setRating(avgRating)
        setUsedAiAssist(true)
        setShowAIModal(false)
      } catch (e) {
        alert(e instanceof ApiError ? e.message : 'AI 리뷰 생성에 실패했습니다.')
      } finally {
        setAiGenerating(false)
      }
    })()
  }

  const handleSubmit = () => {
    const memberProfileId = resolveMemberProfileIdForReview(orderId, profile?.memberProfileId)
    if (memberProfileId == null || Number.isNaN(Number(memberProfileId))) {
      alert(
        '회원 프로필 ID를 확인할 수 없습니다. 결제 시 주문이 서버에 생성된 뒤 다시 시도해 주세요. (데모 주문만 있는 경우에는 실제 주문을 한 번 진행해 주세요.)',
      )
      return
    }
    if (!orderId || !storeId) {
      alert('주문 정보(orderId / storeId)가 없습니다. 주문 내역에서 리뷰 작성을 다시 시도해 주세요.')
      return
    }
    if (rating === 0) {
      alert('별점을 선택해주세요.')
      return
    }
    if (content.length < 10) {
      alert('리뷰는 최소 10자 이상 작성해주세요.')
      return
    }

    const hasModalSubs =
      usedAiAssist && aiRatings.taste > 0 && aiRatings.packaging > 0 && aiRatings.pickup > 0
    const packagingRating = hasModalSubs ? aiRatings.packaging : rating
    const tasteRating = hasModalSubs ? aiRatings.taste : rating
    const timeRating = hasModalSubs ? aiRatings.pickup : rating

    setSubmitLoading(true)
    void (async () => {
      try {
        const imagePaths: string[] = []
        for (const { file } of pendingPhotos) {
          imagePaths.push(await uploadImageFileViaPresigned('REVIEW', file))
        }

        await createReview({
          orderId,
          memberProfileId: Number(memberProfileId),
          storeId,
          overallRating: rating,
          packagingRating,
          tasteRating,
          timeRating,
          content: content.trim(),
          aiGeneratedHelped: usedAiAssist,
          imagePaths: imagePaths.length > 0 ? imagePaths : undefined,
        })
        alert('리뷰가 등록되었습니다.')
        onSubmitted?.()
      } catch (e) {
        alert(e instanceof ApiError ? e.message : '리뷰 등록에 실패했습니다.')
      } finally {
        setSubmitLoading(false)
      }
    })()
  }

  return (
    <Layout showBackground={false}>
      <div className={styles.root}>
        <header className={styles.header}>
          <button type="button" onClick={() => onBack?.()} className={styles.backButton}>
            <span className={`material-symbols-outlined ${styles.backIcon}`}>arrow_back</span>
          </button>
          <h1 className={styles.headerTitle}>리뷰 쓰기</h1>
        </header>

        <div className={styles.scrollArea}>
          <section className={styles.storeSection}>
            <span className={styles.verifiedBadge}>인증된 방문</span>
            <h2 className={styles.storeName}>{storeName}</h2>
            <p className={styles.storeSub}>방문하신 매장은 어떠셨나요?</p>
            <div className={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => handleStarClick(star)} className={styles.starButton}>
                  <span className={`material-symbols-outlined ${styles.starIcon} ${star <= rating ? styles.starIconOn : styles.starIconOff}`}>star</span>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.photosSection}>
            <div className={styles.photosHeader}>
              <h3 className={styles.photosTitle}>어떤 점이 좋았나요?</h3>
              <span className={styles.photosOptional}>(선택사항)</span>
            </div>
            <p className={styles.photosHint}>추가한 사진을 누르면 크게 미리보기 할 수 있어요.</p>
            <div className={styles.photosRow}>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                multiple
                className={styles.visuallyHidden}
                aria-hidden
                tabIndex={-1}
                onChange={(e) => {
                  handlePhotoFiles(e.target.files)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                className={styles.addPhotoButton}
                disabled={pendingPhotos.length >= MAX_REVIEW_IMAGES}
                onClick={() => photoInputRef.current?.click()}
              >
                <span className={`material-symbols-outlined ${styles.addPhotoIcon}`}>photo_camera</span>
                <span className={styles.addPhotoLabel}>사진추가</span>
              </button>
              {pendingPhotos.map((photo, index) => (
                <div key={`${photo.previewUrl}-${index}`} className={styles.photoWrap}>
                  <div
                    role="button"
                    tabIndex={0}
                    className={styles.photoThumbHit}
                    onClick={() => setPhotoPreviewIndex(index)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setPhotoPreviewIndex(index)
                      }
                    }}
                    aria-label={`사진 ${index + 1} 크게 보기`}
                  >
                    <img src={photo.previewUrl} alt="" className={styles.photoImg} draggable={false} />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemovePhoto(index)
                      setPhotoPreviewIndex((cur) => {
                        if (cur === null) return null
                        if (cur === index) return null
                        if (cur > index) return cur - 1
                        return cur
                      })
                    }}
                    className={styles.removePhotoButton}
                  >
                    <span className={`material-symbols-outlined ${styles.removePhotoIcon}`}>close</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.contentSection}>
            <div className={styles.contentHeader}>
              <h3 className={styles.contentTitle}>리뷰 작성</h3>
              <button type="button" onClick={() => setShowAIModal(true)} className={styles.aiButton}>
                <span className={`material-symbols-outlined ${styles.aiButtonIcon}`}>auto_awesome</span>
                AI리뷰 생성
              </button>
            </div>
            <div className={styles.textareaWrap}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="매장에 대한 솔직한 리뷰를 남겨주세요. (최소 10자 이상)"
                maxLength={500}
                className={styles.textarea}
              />
              <span className={styles.charCount}>{content.length}/500</span>
            </div>
          </section>

          <section className={styles.keywordsSection}>
            <h3 className={styles.keywordsTitle}>추천 키워드</h3>
            <div className={styles.keywordsRow}>
              {recommendKeywords.map((keyword) => (
                <button
                  key={keyword.label}
                  onClick={() => handleKeywordToggle(keyword.label)}
                  className={`${styles.keywordButton} ${selectedKeywords.includes(keyword.label) ? styles.keywordButtonActive : styles.keywordButtonInactive}`}
                >
                  <span>{keyword.icon}</span>
                  <span>{keyword.label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className={styles.submitBar}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitLoading}
            className={styles.submitButton}
          >
            {submitLoading ? '등록 중…' : '리뷰 등록하기'}
          </button>
        </div>

        {/* 하단 네비게이션 */}
        <BottomNav 
          active="orders" 
          cartCount={cartCount}
          onNavigate={(page) => {
            if (page === 'home') onGoHome?.()
            if (page === 'cart') onCartClick?.()
            if (page === 'orders') onOrdersClick?.()
            if (page === 'map') onMapClick?.()
            if (page === 'mypage') onMypageClick?.()
          }}
        />

        {typeof document !== 'undefined' &&
          photoPreviewIndex !== null &&
          pendingPhotos[photoPreviewIndex] &&
          createPortal(
            <div className={styles.photoLightbox} role="dialog" aria-modal="true" aria-label="사진 미리보기">
              <button
                type="button"
                className={styles.photoLightboxBackdrop}
                aria-label="닫기"
                onClick={() => setPhotoPreviewIndex(null)}
              />
              <div className={styles.photoLightboxPanel}>
                <button
                  type="button"
                  className={styles.photoLightboxClose}
                  aria-label="닫기"
                  onClick={() => setPhotoPreviewIndex(null)}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
                {pendingPhotos.length > 1 ? (
                  <button
                    type="button"
                    className={styles.photoLightboxPrev}
                    aria-label="이전 사진"
                    onClick={() =>
                      setPhotoPreviewIndex((i) =>
                        i === null ? null : (i - 1 + pendingPhotos.length) % pendingPhotos.length,
                      )
                    }
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                ) : null}
                <img
                  src={pendingPhotos[photoPreviewIndex].previewUrl}
                  alt={`리뷰 사진 ${photoPreviewIndex + 1}`}
                  className={styles.photoLightboxImg}
                  draggable={false}
                />
                {pendingPhotos.length > 1 ? (
                  <button
                    type="button"
                    className={styles.photoLightboxNext}
                    aria-label="다음 사진"
                    onClick={() =>
                      setPhotoPreviewIndex((i) => (i === null ? null : (i + 1) % pendingPhotos.length))
                    }
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                ) : null}
                <p className={styles.photoLightboxCounter}>
                  {photoPreviewIndex + 1} / {pendingPhotos.length}
                </p>
              </div>
            </div>,
            document.body,
          )}

        <AppModal
          open={showAIModal}
          onClose={() => setShowAIModal(false)}
          size="lg"
          flush
          panelClassName={styles.modalShell}
        >
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  <span className={`material-symbols-outlined ${styles.modalTitleIcon}`}>auto_awesome</span>
                  AI 상세평가
                </h3>
                <button type="button" onClick={() => setShowAIModal(false)} className={styles.modalClose}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.modalItem}>
                  <div className={styles.modalItemHeader}>
                    <span className={styles.modalItemLabel}>음식의 맛</span>
                    <span className={styles.modalItemValue}>{getRatingLabel(aiRatings.taste, '음식의 맛')}</span>
                  </div>
                  <div className={styles.modalStarsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setAiRatings(prev => ({ ...prev, taste: star }))} className={styles.modalStarButton}>
                        <span className={`material-symbols-outlined ${styles.modalStarIcon} ${star <= aiRatings.taste ? styles.modalStarOn : styles.modalStarOff}`}>star</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.modalItem}>
                  <div className={styles.modalItemHeader}>
                    <span className={styles.modalItemLabel}>포장 상태</span>
                    <span className={styles.modalItemValue}>{getRatingLabel(aiRatings.packaging, '포장 상태')}</span>
                  </div>
                  <div className={styles.modalStarsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setAiRatings(prev => ({ ...prev, packaging: star }))} className={styles.modalStarButton}>
                        <span className={`material-symbols-outlined ${styles.modalStarIcon} ${star <= aiRatings.packaging ? styles.modalStarOn : styles.modalStarOff}`}>star</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.modalItem}>
                  <div className={styles.modalItemHeader}>
                    <span className={styles.modalItemLabel}>픽업 경험</span>
                    <span className={styles.modalItemValue}>{getRatingLabel(aiRatings.pickup, '픽업 경험')}</span>
                  </div>
                  <div className={styles.modalStarsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setAiRatings(prev => ({ ...prev, pickup: star }))} className={styles.modalStarButton}>
                        <span className={`material-symbols-outlined ${styles.modalStarIcon} ${star <= aiRatings.pickup ? styles.modalStarOn : styles.modalStarOff}`}>star</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={aiGenerating}
                  className={styles.modalSubmit}
                >
                  {aiGenerating ? '생성 중…' : '생성하기'}
                </button>
                <p className={styles.modalHint}>
                  본문에 글이 있으면 초안을 다듬고, 비어 있으면 선택한 세부 별점으로 새 리뷰를 만듭니다.
                </p>
              </div>
        </AppModal>
      </div>
    </Layout>
  )
}

export default ReviewWritePage
