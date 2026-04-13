/**
 * ReviewWritePage.tsx
 * 리뷰 작성 페이지 (주문내역에서 '리뷰 쓰기' 클릭 시)
 * - 매장명, 별점(음식/가격/픽업경험), 사진, 한줄평, 추천 키워드, AI 리뷰 도움 모달
 */

import { useState } from 'react'
import Layout from '../../components/Layout'
import BottomNav from '../../components/BottomNav'
import AppModal from '../../components/AppModal/AppModal'
import styles from './ReviewWritePage.module.css'

interface ReviewWritePageProps {
  storeName?: string
  onBack?: () => void
  onSubmit?: (review: ReviewData) => void
  onGoHome?: () => void
  onCartClick?: () => void
  onOrdersClick?: () => void
  onMapClick?: () => void
  onMypageClick?: () => void
  cartCount?: number
}

interface ReviewData {
  rating: number
  content: string
  photos: string[]
  keywords: string[]
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
  onBack,
  onSubmit,
  onGoHome,
  onCartClick,
  onOrdersClick,
  onMapClick,
  onMypageClick,
  cartCount = 0
}: ReviewWritePageProps) {
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop'
  ])
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  
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

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handleAIGenerate = () => {
    // 모든 별점이 선택되었는지 확인
    if (aiRatings.taste === 0 || aiRatings.packaging === 0 || aiRatings.pickup === 0) {
      alert('모든 항목의 별점을 선택해주세요.')
      return
    }
    
    // AI 리뷰 생성 로직
    const tasteText = aiRatings.taste >= 4 ? '음식이 정말 맛있었어요!' : '음식은 무난했어요.'
    const packagingText = aiRatings.packaging >= 4 ? '포장도 깔끔하게 해주셔서' : '포장 상태는 괜찮았고'
    const pickupText = aiRatings.pickup >= 4 ? '픽업 경험도 만족스러웠습니다.' : '픽업은 편리했습니다.'
    
    const generatedReview = `${tasteText} ${packagingText} ${pickupText} 다음에도 또 방문하고 싶어요!`
    setContent(generatedReview)
    
    // 평균 별점 계산
    const avgRating = Math.round((aiRatings.taste + aiRatings.packaging + aiRatings.pickup) / 3)
    setRating(avgRating)
    
    setShowAIModal(false)
  }

  const handleSubmit = () => {
    if (rating === 0) {
      alert('별점을 선택해주세요.')
      return
    }
    if (content.length < 10) {
      alert('리뷰는 최소 10자 이상 작성해주세요.')
      return
    }
    onSubmit?.({
      rating,
      content,
      photos,
      keywords: selectedKeywords
    })
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
            <div className={styles.photosRow}>
              <button type="button" className={styles.addPhotoButton}>
                <span className={`material-symbols-outlined ${styles.addPhotoIcon}`}>photo_camera</span>
                <span className={styles.addPhotoLabel}>사진추가</span>
              </button>
              {photos.map((photo, index) => (
                <div key={index} className={styles.photoWrap}>
                  <img src={photo} alt={`리뷰 사진 ${index + 1}`} className={styles.photoImg} />
                  <button type="button" onClick={() => handleRemovePhoto(index)} className={styles.removePhotoButton}>
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
          <button type="button" onClick={handleSubmit} className={styles.submitButton}>
            리뷰 등록하기
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
                <button type="button" onClick={handleAIGenerate} className={styles.modalSubmit}>
                  생성하기
                </button>
                <p className={styles.modalHint}>선택하신 평점을 기반으로 정성스러운 리뷰를 생성합니다.</p>
              </div>
        </AppModal>
      </div>
    </Layout>
  )
}

export default ReviewWritePage
