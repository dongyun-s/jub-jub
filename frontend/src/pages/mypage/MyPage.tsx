/**
 * MyPage.tsx
 * 마이페이지 (탭: 내정보)
 * - 프로필·등급·이동거리·주간 출석 퀘스트, 주문내역/쿠폰/리뷰/찜 등 메뉴
 */

import { useEffect, useRef, useState } from 'react'
import Layout from '../../components/Layout'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import styles from './MyPage.module.css'

interface MyPageProps {
  onGoHome?: () => void
  onCartClick?: () => void
  onOrdersClick?: () => void
  onCouponClick?: () => void
  onMapClick?: () => void
  onReviewsClick?: () => void
  onFavoritesClick?: () => void
  cartCount?: number
}

/** 사용자 정보 (데모용) */
const userData = {
  nickname: '전설의 미식가',
  grade: 'GOLD',
  gradeKr: '골드 등급',
  totalDistance: 42.5,
  distanceChange: '+2.4km',
  orderCount: 27,
  nextGradeCount: 30,
  nextGrade: 'Platinum',
}

const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
/** 오늘 요일 인덱스 (0=월 … 6=일) */
const todayIndex = 3

function MyPage({ onGoHome, onCartClick, onOrdersClick, onCouponClick, onMapClick, onReviewsClick, onFavoritesClick, cartCount = 0 }: MyPageProps) {
  /** 요일별 출석 체크 여부 */
  const [checkedDays, setCheckedDays] = useState([true, true, true, false, false, false, false])
  /** 출석 완료 모달 표시 여부 */
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)

  const questSectionRef = useRef<HTMLDivElement | null>(null)

  const progressPercent = (userData.orderCount / userData.nextGradeCount) * 100
  const remainingDistance = 1.2
  const distanceProgress = ((5 - remainingDistance) / 5) * 100

  const consecutiveDays = checkedDays.filter(Boolean).length
  const isTodayChecked = checkedDays[todayIndex]

  /** 오늘 출석 버튼 클릭: 체크 후 모달 표시 */
  const handleAttendanceCheck = () => {
    if (!isTodayChecked) {
      const newCheckedDays = [...checkedDays]
      newCheckedDays[todayIndex] = true
      setCheckedDays(newCheckedDays)
      setShowAttendanceModal(true)
    }
  }

  // 홈 출석 카드에서 진입한 경우에만 주간 퀘스트(출석체크) 섹션을 화면 가운데로 스크롤
  useEffect(() => {
    if (typeof window === 'undefined') return
    const fromHome = window.sessionStorage.getItem('fromHomeAttendance')
    if (fromHome && questSectionRef.current) {
      questSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
    window.sessionStorage.removeItem('fromHomeAttendance')
  }, [])

  return (
    <Layout showBackground={false}>
      <div className={styles.root}>
        <Header title="내 정보" onFavoriteClick={onFavoritesClick} />

        <div className={styles.scrollArea}>
          <section className={styles.profileSection}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatarCircle}>
                <span className={`material-symbols-outlined ${styles.avatarIcon}`}>face_6</span>
              </div>
              <div className={styles.gradeBadge}>{userData.grade}</div>
            </div>
            <h2 className={styles.profileName}>{userData.nickname}</h2>
            <p className={styles.profileGrade}>{userData.gradeKr}</p>
          </section>

          <section className={styles.statsSection}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>이동 거리</p>
                <p className={`${styles.statValue} ${styles.statValuePrimary}`}>{userData.totalDistance} KM</p>
                <div className={styles.statSub}>
                  <span className={`material-symbols-outlined ${styles.statTrendIcon}`}>trending_up</span>
                  지난주 대비 {userData.distanceChange}
                </div>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>현재 등급</p>
                <p className={`${styles.statValue} ${styles.statValueDark}`}>{userData.gradeKr}</p>
                <div className={styles.progressBarWrap}>
                  <div className={styles.progressBar}>
                    <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
                  </div>
                  <p className={styles.progressLabel}>{userData.orderCount}/{userData.nextGradeCount} 회</p>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.distanceGoalSection}>
            <div className={styles.distanceGoalCard}>
              <div className={styles.distanceGoalHeader}>
                <h3 className={styles.distanceGoalTitle}>
                  <span className={`material-symbols-outlined ${styles.distanceGoalIcon}`}>directions_walk</span>
                  이동 거리 목표
                </h3>
                <span className={styles.distanceGoalBadge}>D-{remainingDistance} KM</span>
              </div>
              <div className={styles.distanceGoalBarWrap}>
                <div className={styles.distanceGoalBarFill} style={{ width: `${distanceProgress}%` }} />
              </div>
              <p className={styles.distanceGoalDesc}>다음 목표까지 {remainingDistance} KM 남았습니다!</p>
            </div>
          </section>

          <section ref={questSectionRef} className={styles.questSection}>
            <div className={styles.questHeader}>
              <h3 className={styles.questTitle}>
                <span className={`material-symbols-outlined ${styles.questIcon}`}>calendar_month</span>
                주간 퀘스트(출석체크)
              </h3>
              <span className={styles.questBadge}>{consecutiveDays}일 연속 달성 중!</span>
            </div>
            <div className={styles.weekGrid}>
              {weekDays.map((day, idx) => (
                <div
                  key={day}
                  className={`${styles.dayCell} ${idx === todayIndex ? styles.dayCellToday : ''} ${!checkedDays[idx] && idx !== todayIndex ? styles.dayCellPast : ''}`}
                >
                  <span className={`${styles.dayLabel} ${idx === todayIndex ? styles.dayLabelToday : ''}`}>{day}</span>
                  {idx === todayIndex ? (
                    <button
                      onClick={handleAttendanceCheck}
                      disabled={isTodayChecked}
                      className={`${styles.todayButton} ${isTodayChecked ? styles.todayButtonChecked : styles.todayButtonUnchecked}`}
                    >
                      {isTodayChecked ? (
                        <span className={`material-symbols-outlined ${styles.todayButtonIcon}`}>check</span>
                      ) : (
                        <span className={`material-symbols-outlined ${styles.starIcon}`}>star</span>
                      )}
                    </button>
                  ) : (
                    <div className={`${styles.dayDot} ${checkedDays[idx] ? styles.dayDotChecked : styles.dayDotUnchecked}`}>
                      {checkedDays[idx] && (
                        <span className={`material-symbols-outlined ${styles.dayDotIcon}`}>check</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {!isTodayChecked && (
              <p className={styles.attendanceHint}>오늘의 출석체크를 해주세요! 👆</p>
            )}
          </section>

          <section className={styles.menuSection}>
            <div className={styles.menuList}>
              <button onClick={onOrdersClick} className={styles.menuItem}>
                <div className={styles.menuLeft}>
                  <div className={`${styles.menuIconWrap} ${styles.menuIconPink}`}>
                    <span className="material-symbols-outlined">receipt_long</span>
                  </div>
                  <span className={styles.menuLabel}>주문 내역</span>
                </div>
                <span className={`material-symbols-outlined ${styles.chevron}`}>chevron_right</span>
              </button>
              <button onClick={onCouponClick} className={styles.menuItem}>
                <div className={styles.menuLeft}>
                  <div className={`${styles.menuIconWrap} ${styles.menuIconYellow}`}>
                    <span className="material-symbols-outlined">confirmation_number</span>
                  </div>
                  <span className={styles.menuLabel}>쿠폰함</span>
                </div>
                <div className={styles.menuRight}>
                  <span className={styles.newBadge}>NEW</span>
                  <span className={`material-symbols-outlined ${styles.chevron}`}>chevron_right</span>
                </div>
              </button>
              <button onClick={onReviewsClick} className={styles.menuItem}>
                <div className={styles.menuLeft}>
                  <div className={`${styles.menuIconWrap} ${styles.menuIconEmerald}`}>
                    <span className="material-symbols-outlined">rate_review</span>
                  </div>
                  <span className={styles.menuLabel}>리뷰 관리</span>
                </div>
                <span className={`material-symbols-outlined ${styles.chevron}`}>chevron_right</span>
              </button>
              <button type="button" onClick={() => onFavoritesClick?.()} className={styles.menuItem}>
                <div className={styles.menuLeft}>
                  <div className={`${styles.menuIconWrap} ${styles.menuIconRed}`}>
                    <span className={`material-symbols-outlined ${styles.menuIconFilled}`}>favorite</span>
                  </div>
                  <span className={styles.menuLabel}>찜 목록</span>
                </div>
                <span className={`material-symbols-outlined ${styles.chevron}`}>chevron_right</span>
              </button>
              <button type="button" className={styles.menuItem}>
                <div className={styles.menuLeft}>
                  <div className={`${styles.menuIconWrap} ${styles.menuIconGray}`}>
                    <span className="material-symbols-outlined">person_outline</span>
                  </div>
                  <span className={styles.menuLabel}>개인정보 설정</span>
                </div>
                <span className={`material-symbols-outlined ${styles.chevron}`}>chevron_right</span>
              </button>
              <button type="button" className={styles.menuItem}>
                <div className={styles.menuLeft}>
                  <div className={`${styles.menuIconWrap} ${styles.menuIconGray}`}>
                    <span className="material-symbols-outlined">help_outline</span>
                  </div>
                  <span className={styles.menuLabel}>고객센터</span>
                </div>
                <span className={`material-symbols-outlined ${styles.chevron}`}>chevron_right</span>
              </button>
            </div>
          </section>
        </div>

        <BottomNav 
          active="mypage" 
          cartCount={cartCount}
          onNavigate={(page) => {
            if (page === 'home') onGoHome?.()
            if (page === 'orders') onOrdersClick?.()
            if (page === 'cart') onCartClick?.()
            if (page === 'map') onMapClick?.()
          }}
        />

        {/* 출석 완료 시 표시되는 모달 */}
        {showAttendanceModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalBox}>
              <div className={styles.modalIconWrap}>
                <span className={`material-symbols-outlined ${styles.modalIcon}`}>check_circle</span>
              </div>
              <h3 className={styles.modalTitle}>출석 완료!</h3>
              <p className={styles.modalDesc}>오늘의 출석체크가 완료되었습니다.</p>
              <p className={styles.modalSub}>🔥 {consecutiveDays}일 연속 출석 중!</p>
              <button onClick={() => setShowAttendanceModal(false)} className={styles.modalButton}>
                확인
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default MyPage
