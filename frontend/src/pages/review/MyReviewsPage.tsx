/**
 * MyReviewsPage.tsx
 * 내 리뷰 관리 페이지 (마이페이지 → 리뷰 관리)
 * - 작성한 리뷰 카드 목록, 수정/삭제, 삭제 확인 모달
 */

import { useState } from 'react'
import Layout from '../../components/Layout'
import BottomNav from '../../components/BottomNav'
import styles from './MyReviewsPage.module.css'

interface MyReviewsPageProps {
  onBack?: () => void
  onWriteReview?: () => void
  onGoHome?: () => void
  onCartClick?: () => void
  onOrdersClick?: () => void
  onMapClick?: () => void
  onMypageClick?: () => void
  cartCount?: number
}

interface Review {
  id: number
  storeName: string
  storeImage: string
  rating: number
  date: string
  content: string
  photos: string[]
  keywords: string[]
}

/** 내가 작성한 리뷰 목록 (데모) */
const mockReviews: Review[] = [
  {
    id: 1,
    storeName: '카페 네온 하이브',
    storeImage: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=100&h=100&fit=crop',
    rating: 5,
    date: '2026.03.10',
    content: '분위기가 정말 좋고 커피도 맛있어요! 작업하기에도 딱 좋은 곳이에요. 다음에 또 방문할 예정입니다.',
    photos: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop'],
    keywords: ['분위기가 좋아요', '커피가 맛있어요'],
  },
  {
    id: 2,
    storeName: '맛있는 치킨집',
    storeImage: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=100&h=100&fit=crop',
    rating: 4,
    date: '2026.03.05',
    content: '치킨이 바삭하고 맛있어요. 배달도 빨랐습니다. 양념치킨 강추!',
    photos: [],
    keywords: ['맛있어요'],
  },
  {
    id: 3,
    storeName: '건강한 샐러드',
    storeImage: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&h=100&fit=crop',
    rating: 5,
    date: '2026.02.28',
    content: '신선한 재료로 만든 샐러드가 정말 맛있어요. 다이어트 중인데 자주 이용하고 있습니다.',
    photos: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop'],
    keywords: ['건강해요', '신선해요'],
  },
]

function MyReviewsPage({ 
  onBack, 
  onWriteReview,
  onGoHome,
  onCartClick,
  onOrdersClick,
  onMapClick,
  onMypageClick,
  cartCount = 0
}: MyReviewsPageProps) {
  const [reviews, setReviews] = useState<Review[]>(mockReviews)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null)

  const handleDeleteClick = (id: number) => {
    setSelectedReviewId(id)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = () => {
    if (selectedReviewId !== null) {
      setReviews(prev => prev.filter(r => r.id !== selectedReviewId))
    }
    setShowDeleteModal(false)
    setSelectedReviewId(null)
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
          <button type="button" onClick={onBack} className={styles.backButton}>
            <span className={`material-symbols-outlined ${styles.backIcon}`}>arrow_back</span>
          </button>
          <h1 className={styles.headerTitle}>리뷰 관리</h1>
        </header>

        <div className={styles.scrollArea}>
          {reviews.length > 0 ? (
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
                          <span key={keyword} className={styles.keyword}>{keyword}</span>
                        ))}
                      </div>
                    )}
                    <div className={styles.cardActions}>
                      <button type="button" className={styles.actionButton}>
                        <span className={`material-symbols-outlined ${styles.actionIcon}`}>edit</span>
                        수정
                      </button>
                      <button type="button" onClick={() => handleDeleteClick(review.id)} className={`${styles.actionButton} ${styles.actionButtonDelete}`}>
                        <span className={`material-symbols-outlined ${styles.actionIcon}`}>delete</span>
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className={styles.emptySection}>
              <span className={`material-symbols-outlined ${styles.emptyIcon}`}>rate_review</span>
              <p className={styles.emptyTitle}>작성한 리뷰가 없어요</p>
              <p className={styles.emptyDesc}>맛있게 드신 곳의 리뷰를 남겨보세요!</p>
              <button type="button" onClick={onWriteReview} className={styles.emptyCta}>
                리뷰 쓰러가기
              </button>
            </section>
          )}
        </div>

        {showDeleteModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalBox}>
              <h3 className={styles.modalTitle}>리뷰 삭제</h3>
              <p className={styles.modalDesc}>
                정말 이 리뷰를 삭제하시겠어요?<br />삭제된 리뷰는 복구할 수 없습니다.
              </p>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowDeleteModal(false)} className={styles.modalCancel}>
                  취소
                </button>
                <button type="button" onClick={handleDeleteConfirm} className={styles.modalConfirm}>
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 하단 네비게이션 */}
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
