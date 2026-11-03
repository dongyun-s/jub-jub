/**
 * ReviewWritePage.tsx
 * 리뷰 작성 페이지 (주문내역에서 '리뷰 쓰기' 클릭 시)
 * - 매장명, 별점, 사진, 한줄평, AI 리뷰 도움 모달
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Layout from '../../components/Layout'
import BottomNav from '../../components/BottomNav'
import AppModal from '../../components/AppModal/AppModal'
import mc from '../../components/AppModal/modalContent.module.css'
import { ApiError } from '../../api/authClient'
import { assertImageFileConstraints, MAX_REVIEW_IMAGES, uploadImageFileViaPresigned } from '../../api/uploads'
import { createReview, fetchReview, generateAiReview, notifyReviewsUpdated, updateReview } from '../../api/reviews'
import { useProfile } from '../../hooks/useProfile'
import { getCachedMemberProfileId, resolveMemberProfileIdForReview, setCachedMemberProfileId } from '../../lib/authStorage'
import { normalizeReviewImageList, resolveDisplayImageUrl } from '../../lib/imageUrl'
import { notifyReviewNotificationsUpdated } from '../../hooks/useUnreadReviewNotificationCount'
import SimpleAlertModal from '../../components/SimpleAlertModal/SimpleAlertModal'
import styles from './ReviewWritePage.module.css'

interface ReviewWritePageProps {
  storeName?: string
  orderId: number
  storeId: number
  reviewId?: number
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

type PendingPhotoRow = { id: number; file: File; previewUrl: string }

/** blob: 대비해 data URL 미리보기 — 일부 WebView에서 썸네일이 더 잘 보입니다. */
function readPreviewDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => {
      const s = typeof fr.result === 'string' ? fr.result : ''
      if (s.startsWith('data:')) resolve(s)
      else reject(new Error('invalid preview'))
    }
    fr.onerror = () => reject(new Error('read error'))
    fr.readAsDataURL(file)
  })
}

function revokePreviewUrl(url: string) {
  if (url.startsWith('blob:')) URL.revokeObjectURL(url)
}

function ReviewWritePage({ 
  storeName = '카페 네온 하이브',
  orderId,
  storeId,
  reviewId,
  onBack,
  onSubmitted,
  onGoHome,
  onCartClick,
  onOrdersClick,
  onMapClick,
  onMypageClick,
  cartCount = 0
}: ReviewWritePageProps) {
  const isEditMode = reviewId != null && reviewId > 0
  const { profile } = useProfile()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const photoIdRef = useRef(0)
  const pendingPhotosRef = useRef<PendingPhotoRow[]>([])
  const [editLoading, setEditLoading] = useState(isEditMode)
  const [existingImagePaths, setExistingImagePaths] = useState<string[]>([])
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  /** 로컬 미리보기(data URL) + 업로드용 File */
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhotoRow[]>([])
  const [photoPickLoading, setPhotoPickLoading] = useState(false)
  const [usedAiAssist, setUsedAiAssist] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [photoPreviewIndex, setPhotoPreviewIndex] = useState<number | null>(null)
  
  // AI 모달 관련 상태
  const [showAIModal, setShowAIModal] = useState(false)
  const [resultAlert, setResultAlert] = useState<{
    open: boolean
    title: string
    message: string
    variant: 'success' | 'error' | 'info'
    closeAndSubmit?: boolean
  }>({ open: false, title: '', message: '', variant: 'info' })
  const [aiRatings, setAiRatings] = useState({
    taste: 0,
    packaging: 0,
    pickup: 0,
  })

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack()
      return
    }
    onGoHome?.()
  }, [onBack, onGoHome])

  const handleStarClick = (star: number) => {
    setRating(star)
  }

  const totalPhotoCount = existingImagePaths.length + pendingPhotos.length

  useEffect(() => {
    if (!isEditMode || !reviewId) {
      setEditLoading(false)
      return
    }
    let cancelled = false
    void (async () => {
      setEditLoading(true)
      try {
        const dto = await fetchReview(reviewId)
        if (cancelled) return
        setRating(dto.overallRating)
        setContent(dto.content)
        setUsedAiAssist(Boolean(dto.aiGeneratedHelped))
        const taste = dto.tasteRating ?? 0
        const packaging = dto.packagingRating ?? 0
        const pickup = dto.timeRating ?? 0
        if (taste > 0 && packaging > 0 && pickup > 0) {
          setAiRatings({ taste, packaging, pickup })
        }
        const paths = normalizeReviewImageList(dto as unknown as Record<string, unknown>)
        setExistingImagePaths(paths)
      } catch (e) {
        if (!cancelled) {
          alert(e instanceof ApiError ? e.message : '리뷰 정보를 불러오지 못했습니다.')
          handleBack()
        }
      } finally {
        if (!cancelled) setEditLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isEditMode, reviewId, handleBack])

  useLayoutEffect(() => {
    pendingPhotosRef.current = pendingPhotos
  }, [pendingPhotos])

  useEffect(() => {
    return () => {
      for (const p of pendingPhotosRef.current) {
        revokePreviewUrl(p.previewUrl)
      }
    }
  }, [])

  useEffect(() => {
    if (photoPreviewIndex === null) return
    const len = totalPhotoCount
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
  }, [photoPreviewIndex, totalPhotoCount])

  useEffect(() => {
    if (totalPhotoCount === 0) setPhotoPreviewIndex(null)
    else if (photoPreviewIndex !== null && photoPreviewIndex >= totalPhotoCount) {
      setPhotoPreviewIndex(totalPhotoCount - 1)
    }
  }, [totalPhotoCount, photoPreviewIndex])

  const previewUrlAt = (index: number): string => {
    if (index < existingImagePaths.length) {
      const path = existingImagePaths[index]!
      const u = resolveDisplayImageUrl(path)
      return (u && u.length > 0 ? u : path) as string
    }
    const row = pendingPhotos[index - existingImagePaths.length]
    return row?.previewUrl ?? ''
  }

  const handleRemoveExistingPhoto = (index: number) => {
    setExistingImagePaths((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviewIndex((cur) => {
      if (cur === null) return null
      if (cur === index) return null
      if (cur > index) return cur - 1
      return cur
    })
  }

  /** File/Blob — 일부 환경에서 `instanceof File` 만으로 걸러질 수 있음 */
  const isUploadableImage = (f: unknown): f is Blob =>
    typeof Blob !== 'undefined' && f instanceof Blob

  const handlePhotoFiles = (list: FileList | null) => {
    if (!list?.length) return
    setPhotoPickLoading(true)
    void (async () => {
      try {
        const batch: PendingPhotoRow[] = []
        for (let i = 0; i < list.length; i++) {
          const file = list[i]
          try {
            assertImageFileConstraints(file)
          } catch (e) {
            alert(e instanceof ApiError ? e.message : '이미지를 추가할 수 없습니다.')
            continue
          }
          try {
            const previewUrl = await readPreviewDataUrl(file)
            batch.push({ id: ++photoIdRef.current, file, previewUrl })
          } catch {
            alert('이 사진의 미리보기를 만들 수 없습니다. JPEG·PNG·WebP·GIF 파일을 선택해 주세요.')
          }
        }
        if (batch.length === 0) return
        setPendingPhotos((prev) => {
          const next = [...prev]
          for (const row of batch) {
            if (existingImagePaths.length + next.length >= MAX_REVIEW_IMAGES) {
              alert(`사진은 최대 ${MAX_REVIEW_IMAGES}장까지 추가할 수 있습니다.`)
              break
            }
            next.push(row)
          }
          pendingPhotosRef.current = next
          return next
        })
      } finally {
        setPhotoPickLoading(false)
      }
    })()
  }

  const handleRemovePhoto = (index: number) => {
    setPendingPhotos((prev) => {
      const row = prev[index]
      if (row) revokePreviewUrl(row.previewUrl)
      const next = prev.filter((_, i) => i !== index)
      pendingPhotosRef.current = next
      return next
    })
  }

  /** 본문 초안이 있으면 프롬프트(초안 다듬기) API만 호출 — 별점 모달 없음 */
  const runAiFromDraft = (draft: string) => {
    void (async () => {
      setAiGenerating(true)
      try {
        const res = await generateAiReview({
          packagingRating: 0,
          tasteRating: 0,
          timeRating: 0,
          content: draft,
        })
        setContent(res.generatedReview)
        setUsedAiAssist(true)
        setShowAIModal(false)
      } catch (e) {
        alert(e instanceof ApiError ? e.message : 'AI 리뷰 생성에 실패했습니다.')
      } finally {
        setAiGenerating(false)
      }
    })()
  }

  /** 본문이 비어 있을 때만 — 모달에서 고른 세부 별점으로 생성 */
  const handleAIGenerateFromModal = () => {
    if (aiRatings.taste === 0 || aiRatings.packaging === 0 || aiRatings.pickup === 0) {
      alert('모든 항목의 별점을 선택해주세요.')
      return
    }

    void (async () => {
      setAiGenerating(true)
      try {
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

  const handleAIButtonClick = () => {
    const draft = content.trim()
    if (draft) {
      runAiFromDraft(draft)
      return
    }
    setShowAIModal(true)
  }

  const handleSubmit = () => {
    const memberProfileId = isEditMode
      ? profile?.memberProfileId ?? getCachedMemberProfileId()
      : resolveMemberProfileIdForReview(orderId, profile?.memberProfileId)
    if (memberProfileId == null || Number.isNaN(Number(memberProfileId))) {
      alert(
        isEditMode
          ? '회원 프로필 정보를 확인할 수 없습니다. 다시 로그인한 뒤 시도해 주세요.'
          : '회원 프로필 ID를 확인할 수 없습니다. 결제 완료 후 생성된 주문에서 다시 시도해 주세요.',
      )
      return
    }
    if (!isEditMode && (!orderId || !storeId)) {
      alert('주문 정보(orderId / storeId)가 없습니다. 주문 내역에서 리뷰 작성을 다시 시도해 주세요.')
      return
    }
    if (isEditMode && !reviewId) {
      alert('수정할 리뷰 정보가 없습니다.')
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

    /**
     * 제출 직전 ref가 가장 최신(추가/삭제 시 setState 업데이터 안에서 동기 갱신).
     * state 클로저만 쓰면 클릭 한 타이밍에 빈 배열이 될 수 있어 ref 우선 + state 보조.
     */
    const refSnap = pendingPhotosRef.current.filter((r) => isUploadableImage(r?.file))
    const stateSnap = pendingPhotos.filter((r) => isUploadableImage(r?.file))
    const photosSnapshot = refSnap.length >= stateSnap.length ? refSnap : stateSnap

    setSubmitLoading(true)
    void (async () => {
      try {
        const imagePaths: string[] = []
        for (const row of photosSnapshot) {
          const url = (await uploadImageFileViaPresigned('REVIEW', row.file)).trim()
          if (!url) {
            throw new ApiError('업로드된 이미지 URL이 비어 있습니다. 다시 시도해 주세요.', { status: 502 })
          }
          imagePaths.push(url)
        }

        const allImagePaths = [...existingImagePaths, ...imagePaths]
        const body = {
          memberProfileId: Number(memberProfileId),
          overallRating: rating,
          packagingRating,
          tasteRating,
          timeRating,
          content: content.trim(),
          aiGeneratedHelped: usedAiAssist,
          imagePaths: allImagePaths.length > 0 ? allImagePaths : undefined,
        }

        if (isEditMode && reviewId) {
          await updateReview(reviewId, body)
          notifyReviewsUpdated()
          setResultAlert({
            open: true,
            title: '리뷰 수정 완료',
            message:
              allImagePaths.length > 0
                ? `리뷰가 수정되었습니다. 사진 ${allImagePaths.length}장이 반영되었습니다.`
                : '리뷰가 수정되었습니다.',
            variant: 'success',
            closeAndSubmit: true,
          })
        } else {
          await createReview({
            orderId,
            storeId,
            ...body,
          })
          setCachedMemberProfileId(Number(memberProfileId))
          notifyReviewNotificationsUpdated()
          notifyReviewsUpdated()
          setResultAlert({
            open: true,
            title: '리뷰 등록 완료',
            message:
              allImagePaths.length > 0
                ? `리뷰가 등록되었습니다. 사진 ${allImagePaths.length}장이 함께 저장되었습니다.`
                : '리뷰가 등록되었습니다.',
            variant: 'success',
            closeAndSubmit: true,
          })
        }
      } catch (e) {
        setResultAlert({
          open: true,
          title: isEditMode ? '수정 실패' : '등록 실패',
          message: e instanceof ApiError ? e.message : isEditMode ? '리뷰 수정에 실패했습니다.' : '리뷰 등록에 실패했습니다.',
          variant: 'error',
        })
      } finally {
        setSubmitLoading(false)
      }
    })()
  }

  return (
    <Layout showBackground={false}>
      <div className={styles.root}>
        <header className={styles.header}>
          <button type="button" onClick={handleBack} className={styles.backButton} aria-label="뒤로 가기">
            <span className={`material-symbols-outlined ${styles.backIcon}`}>arrow_back</span>
          </button>
          <h1 className={styles.headerTitle}>{isEditMode ? '리뷰 수정' : '리뷰 쓰기'}</h1>
        </header>

        {editLoading ? (
          <div className={styles.scrollArea}>
            <p className={styles.storeSub}>리뷰 정보를 불러오는 중…</p>
          </div>
        ) : null}

        <div className={styles.scrollArea} style={editLoading ? { display: 'none' } : undefined}>
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
              <div className={styles.photosHeaderLeft}>
                <h3 className={styles.photosTitle}>맛있는 순간, 사진으로 남겨요</h3>
                {totalPhotoCount > 0 ? (
                  <span className={styles.photoCountBadge} aria-live="polite">
                    {totalPhotoCount}장 골랐어요
                  </span>
                ) : null}
              </div>
              <span className={styles.photosOptional}>(선택사항)</span>
            </div>
            <p className={styles.photosHint}>
              최대 {MAX_REVIEW_IMAGES}장까지 · 썸네일을 누르면 크게 볼 수 있어요
            </p>
            {photoPickLoading ? (
              <p className={styles.photoReadPending}>잠깐만요, 미리보기 준비 중이에요…</p>
            ) : null}
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
                disabled={totalPhotoCount >= MAX_REVIEW_IMAGES || photoPickLoading}
                onClick={() => photoInputRef.current?.click()}
              >
                <span className={`material-symbols-outlined ${styles.addPhotoIcon}`}>photo_camera</span>
                <span className={styles.addPhotoLabel}>사진 고르기</span>
              </button>
              {existingImagePaths.map((path, index) => {
                const previewUrl = resolveDisplayImageUrl(path) || path
                return (
                  <div key={`existing-${path}-${index}`} className={styles.photoWrap}>
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
                      aria-label={`기존 사진 ${index + 1} 크게 보기`}
                    >
                      <img src={previewUrl} alt="" className={styles.photoImg} draggable={false} />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveExistingPhoto(index)
                      }}
                      className={styles.removePhotoButton}
                    >
                      <span className={`material-symbols-outlined ${styles.removePhotoIcon}`}>close</span>
                    </button>
                  </div>
                )
              })}
              {pendingPhotos.map((photo, index) => {
                const displayIndex = existingImagePaths.length + index
                return (
                <div key={photo.id} className={styles.photoWrap}>
                  <div
                    role="button"
                    tabIndex={0}
                    className={styles.photoThumbHit}
                    onClick={() => setPhotoPreviewIndex(displayIndex)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setPhotoPreviewIndex(displayIndex)
                      }
                    }}
                    aria-label={`사진 ${displayIndex + 1} 크게 보기`}
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
                        if (cur === displayIndex) return null
                        if (cur > displayIndex) return cur - 1
                        return cur
                      })
                    }}
                    className={styles.removePhotoButton}
                  >
                    <span className={`material-symbols-outlined ${styles.removePhotoIcon}`}>close</span>
                  </button>
                </div>
              )})}
            </div>
          </section>

          <section className={styles.contentSection}>
            <div className={styles.contentHeader}>
              <h3 className={styles.contentTitle}>{isEditMode ? '리뷰 수정' : '리뷰 작성'}</h3>
              <button
                type="button"
                onClick={handleAIButtonClick}
                disabled={aiGenerating}
                className={styles.aiButton}
              >
                <span className={`material-symbols-outlined ${styles.aiButtonIcon}`}>auto_awesome</span>
                {aiGenerating ? 'AI 생성 중…' : 'AI리뷰 생성'}
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
        </div>

        <div className={styles.submitBar}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitLoading || editLoading}
            className={styles.submitButton}
          >
            {submitLoading
              ? isEditMode
                ? '수정 중…'
                : '등록 중…'
              : isEditMode
                ? '리뷰 수정하기'
                : '리뷰 등록하기'}
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
          previewUrlAt(photoPreviewIndex) &&
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
                {totalPhotoCount > 1 ? (
                  <button
                    type="button"
                    className={styles.photoLightboxPrev}
                    aria-label="이전 사진"
                    onClick={() =>
                      setPhotoPreviewIndex((i) =>
                        i === null ? null : (i - 1 + totalPhotoCount) % totalPhotoCount,
                      )
                    }
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                ) : null}
                <img
                  src={previewUrlAt(photoPreviewIndex)}
                  alt={`리뷰 사진 ${photoPreviewIndex + 1}`}
                  className={styles.photoLightboxImg}
                  draggable={false}
                />
                {totalPhotoCount > 1 ? (
                  <button
                    type="button"
                    className={styles.photoLightboxNext}
                    aria-label="다음 사진"
                    onClick={() =>
                      setPhotoPreviewIndex((i) => (i === null ? null : (i + 1) % totalPhotoCount))
                    }
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                ) : null}
                <p className={styles.photoLightboxCounter}>
                  {photoPreviewIndex + 1} / {totalPhotoCount}
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
        >
              <div className={mc.header}>
                <h3 className={mc.headerTitle}>
                  <span className={`material-symbols-outlined ${mc.headerTitleIcon}`}>auto_awesome</span>
                  AI 상세평가
                </h3>
                <button type="button" onClick={() => setShowAIModal(false)} className={mc.closeBtn} aria-label="닫기">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className={mc.body}>
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
              <div className={mc.footer}>
                <button
                  type="button"
                  onClick={handleAIGenerateFromModal}
                  disabled={aiGenerating}
                  className={mc.btnPrimary}
                >
                  {aiGenerating ? '생성 중…' : '생성하기'}
                </button>
                <p className={mc.footerHint}>
                  본문이 비어 있을 때만 이 화면이 열립니다. 글을 먼저 쓰고 AI리뷰 생성을 누르면 별점 선택 없이 초안을 다듬습니다.
                </p>
              </div>
        </AppModal>

        <SimpleAlertModal
          open={resultAlert.open}
          title={resultAlert.title}
          message={resultAlert.message}
          variant={resultAlert.variant}
          confirmLabel="확인"
          onClose={() => {
            const shouldFinish = resultAlert.closeAndSubmit
            setResultAlert((prev) => ({ ...prev, open: false, closeAndSubmit: false }))
            if (shouldFinish) onSubmitted?.()
          }}
        />
      </div>
    </Layout>
  )
}

export default ReviewWritePage
