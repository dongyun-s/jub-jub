/**
 * MyPage.tsx
 * 마이페이지 (탭: 내정보)
 * - 프로필·등급·이동거리·주간 출석 퀘스트, 주문내역/쿠폰/리뷰/찜 등 메뉴
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import Layout from '../../components/Layout'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import { useProfile } from '../../hooks/useProfile'
import AppModal from '../../components/AppModal/AppModal'
import { ApiError } from '../../api/authClient'
import { createMyProfileImage, updateMyProfileImage } from '../../api/profileImage'
import { uploadImageFileViaPresigned } from '../../api/uploads'
import {
  fetchAttendanceWeek,
  fetchAttendanceHistory,
  fetchRewardMe,
  postAttendanceCheck,
  type RewardMeResponse,
} from '../../api/rewards'
import { getAccessToken } from '../../lib/authStorage'
import {
  getAttendanceStreak,
  getWeekAttendanceCheckedLocally,
  isAttendanceMarkedDone,
  markAttendanceDone,
  weekIsoDatesMondayFirst,
} from '../../lib/rewardAttendance'
import { getTierLabelEn, getTierTheme } from '../../lib/rewardTierTheme'
import { resolveDisplayImageUrl } from '../../lib/imageUrl'
import styles from './MyPage.module.css'

interface MyPageProps {
  onGoHome?: () => void
  onCartClick?: () => void
  onOrdersClick?: () => void
  onCouponClick?: () => void
  onMapClick?: () => void
  onReviewsClick?: () => void
  onFavoritesClick?: () => void
  onNotificationsClick?: () => void
  onLogout?: () => void
  cartCount?: number
}

const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

/** 월요일=0 … 일요일=6 */
function todayWeekIndex(): number {
  return (new Date().getDay() + 6) % 7
}

function MyPage({ onGoHome, onCartClick, onOrdersClick, onCouponClick, onMapClick, onReviewsClick, onFavoritesClick, onNotificationsClick, onLogout, cartCount = 0 }: MyPageProps) {
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile()
  const avatarFileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const todayIndex = todayWeekIndex()

  /** GET /api/v1/rewards/me */
  const [rewardMe, setRewardMe] = useState<RewardMeResponse | null>(null)
  const [rewardLoading, setRewardLoading] = useState(false)
  const [rewardFetchFailed, setRewardFetchFailed] = useState(false)

  /** 요일별 출석 — 로컬 일별 키 + (있으면) GET /rewards/attendance/week */
  const [checkedDays, setCheckedDays] = useState<boolean[]>(() => Array(7).fill(false))
  /** 출석 완료 모달 표시 여부 */
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [attendanceModalMessage, setAttendanceModalMessage] = useState('오늘의 출석체크가 완료되었습니다.')

  const questSectionRef = useRef<HTMLDivElement | null>(null)

  const loadRewards = useCallback(async () => {
    if (!getAccessToken()) {
      setRewardMe(null)
      setRewardFetchFailed(false)
      return
    }
    setRewardLoading(true)
    try {
      const data = await fetchRewardMe()
      setRewardMe(data)
      setRewardFetchFailed(false)
    } catch {
      setRewardMe(null)
      setRewardFetchFailed(true)
    } finally {
      setRewardLoading(false)
    }
  }, [profile?.email])

  useEffect(() => {
    void loadRewards()
  }, [loadRewards])

  const [attendanceStreak, setAttendanceStreak] = useState(0)

  /** 주간 그리드: 로컬 과거 일별 출석 + 서버 주간 API(선택) + 오늘 플래그 */
  useEffect(() => {
    if (typeof window === 'undefined') return
    let cancelled = false

    const mergeWeek = (local: boolean[], api: boolean[] | null): boolean[] => {
      if (!api || api.length !== 7) return [...local]
      return local.map((v, i) => v || !!api[i])
    }

    const sync = async () => {
      const localWeek = getWeekAttendanceCheckedLocally(profile?.email)
      let merged = [...localWeek]

      if (getAccessToken()) {
        const apiWeek = await fetchAttendanceWeek()
        if (!cancelled) merged = mergeWeek(merged, apiWeek)

        // 월별 출석 내역 API가 있으면 이번 주 날짜와 교집합으로 주간 칸 채우기
        try {
          const now = new Date()
          const history = await fetchAttendanceHistory({
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          })
          if (!cancelled && history.attendedDates.length > 0) {
            const set = new Set(history.attendedDates)
            const weekDates = weekIsoDatesMondayFirst()
            const fromHistory = weekDates.map((d) => set.has(d))
            merged = mergeWeek(merged, fromHistory)
          }
        } catch {
          // 무시 (서버 미구현/에러 시 로컬+주간API만)
        }
      }

      const todayDone = isAttendanceMarkedDone(profile?.email)
      if (!cancelled) {
        merged[todayIndex] = merged[todayIndex] || todayDone
        setCheckedDays(merged)
        setAttendanceStreak(getAttendanceStreak(profile?.email))
      }
    }

    void sync()

    const onLocal = () => {
      void sync()
    }
    window.addEventListener('jubjub-attendance-local', onLocal)
    return () => {
      cancelled = true
      window.removeEventListener('jubjub-attendance-local', onLocal)
    }
  }, [profile?.email, todayIndex])

  const displayNickname =
    rewardMe?.nickname?.trim() ||
    profile?.nickname?.trim() ||
    (profileLoading || rewardLoading ? '불러오는 중…' : '회원')

  const profileGradeBadge =
    rewardMe != null ? getTierLabelEn(rewardMe.tier, rewardMe.tierName) : 'TIER'

  const ordersForNext =
    rewardMe != null && rewardMe.nextTierRequiredCount > 0
      ? rewardMe.orderCount + rewardMe.nextTierRequiredCount
      : rewardMe?.orderCount ?? 1

  const progressPercent =
    rewardMe != null && ordersForNext > 0
      ? Math.min(100, (rewardMe.orderCount / ordersForNext) * 100)
      : rewardMe != null && rewardMe.nextTierRequiredCount === 0
        ? 100
        : 0

  const distanceKm =
    rewardMe != null ? Math.round((rewardMe.totalWalkingDistance / 1000) * 10) / 10 : null

  const cumulativeXpDisplay = rewardMe?.cumulativeXp ?? null

  const tierTheme = getTierTheme(rewardMe?.tier, rewardMe?.tierName)
  const tierLabelEn = getTierLabelEn(rewardMe?.tier, rewardMe?.tierName)

  const isTodayChecked = checkedDays[todayIndex]

  const profileImageUrl = (() => {
    const raw = profile?.profileImagePath?.trim()
    if (!raw) return null
    const u = resolveDisplayImageUrl(raw)
    if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:')) return u
    return null
  })()

  const handleAvatarFileChange = (list: FileList | null) => {
    const file = list?.[0]
    if (!file) return
    if (!getAccessToken()) {
      alert('로그인 후 프로필 사진을 변경할 수 있습니다.')
      return
    }
    void (async () => {
      setAvatarUploading(true)
      try {
        const fileUrl = await uploadImageFileViaPresigned('PROFILE', file)
        const hasExisting = Boolean(profile?.profileImagePath?.trim())
        if (hasExisting) {
          await updateMyProfileImage(fileUrl)
        } else {
          await createMyProfileImage(fileUrl)
        }
        await refetchProfile()
      } catch (e) {
        alert(e instanceof ApiError ? e.message : '프로필 사진을 변경하지 못했습니다.')
      } finally {
        setAvatarUploading(false)
      }
    })()
  }

  /** 오늘 출석 버튼 클릭: POST /api/v1/rewards/attendance */
  const handleAttendanceCheck = () => {
    if (!getAccessToken()) {
      alert('로그인 후 출석체크를 이용할 수 있습니다.')
      return
    }
    if (isTodayChecked) return

    void (async () => {
      try {
        const msg = await postAttendanceCheck()
        markAttendanceDone(profile?.email)
        setCheckedDays((prev) => {
          const next = [...prev]
          next[todayIndex] = true
          return next
        })
        setAttendanceModalMessage(msg || '출석체크가 완료되었습니다.')
        setShowAttendanceModal(true)
        await loadRewards()
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : ''
        const alreadyDone =
          e instanceof ApiError &&
          (e.status === 400 || /이미.*출석|출석.*완료|오늘은 이미/i.test(msg))
        if (alreadyDone) {
          markAttendanceDone(profile?.email)
          setCheckedDays((prev) => {
            const next = [...prev]
            next[todayIndex] = true
            return next
          })
          setAttendanceModalMessage(msg || '오늘 출석은 이미 완료되었습니다.')
          setShowAttendanceModal(true)
          await loadRewards()
          return
        }
        alert(msg || '출석체크를 처리하지 못했습니다.')
      }
    })()
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
        <Header
          title="내 정보"
          onFavoriteClick={onFavoritesClick}
          onNotificationsClick={onNotificationsClick}
        />

        <div className={styles.scrollArea}>
          <section className={styles.profileSection}>
            <div className={styles.avatarWrap}>
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                className={styles.avatarFileInput}
                aria-hidden
                tabIndex={-1}
                onChange={(e) => {
                  handleAvatarFileChange(e.target.files)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                className={styles.avatarTap}
                disabled={avatarUploading || !getAccessToken()}
                onClick={() => avatarFileInputRef.current?.click()}
                aria-label={avatarUploading ? '프로필 사진 업로드 중' : '프로필 사진 변경'}
              >
                <div
                  className={styles.avatarCircle}
                  style={{
                    borderColor: tierTheme.myAvatarRing,
                    boxShadow: tierTheme.myAvatarGlow,
                  }}
                >
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="" className={styles.avatarImage} />
                  ) : (
                    <span
                      className={`material-symbols-outlined ${styles.avatarIcon}`}
                      style={{ color: tierTheme.myAvatarIcon }}
                    >
                      face_6
                    </span>
                  )}
                </div>
              </button>
              <div
                className={styles.gradeBadge}
                style={{ backgroundImage: tierTheme.myBadgeGradient }}
              >
                {profileGradeBadge}
              </div>
            </div>
            <h2 className={styles.profileName}>{displayNickname}</h2>
            {profile?.email && <p className={styles.profileMeta}>{profile.email}</p>}
            {!profile && !profileLoading && (
              <p className={styles.profileMeta}>프로필을 불러오지 못했습니다.</p>
            )}
          </section>

          <section className={styles.statsSection}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>이동 거리</p>
                <p className={`${styles.statValue} ${styles.statValuePrimary}`}>
                  {distanceKm != null ? `${distanceKm} KM` : rewardLoading ? '…' : '—'}
                </p>
                <div className={styles.statSub}>
                  <span className={`material-symbols-outlined ${styles.statTrendIcon}`}>straighten</span>
                  누적 도보 {rewardMe != null ? `${rewardMe.totalWalkingDistance.toLocaleString('ko-KR')} m` : '—'}
                </div>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>현재 등급</p>
                <p
                  className={`${styles.statValue} ${styles.statValueDark}`}
                  style={{ color: tierTheme.myTierNameColor }}
                >
                  {rewardMe != null ? tierLabelEn : rewardLoading ? '…' : '—'}
                </p>
                <div className={styles.progressBarWrap}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressBarFill}
                      style={{
                        width: `${progressPercent}%`,
                        backgroundColor: tierTheme.myTierProgress,
                        boxShadow: tierTheme.myTierProgressGlow,
                      }}
                    />
                  </div>
                  <p className={styles.progressLabel}>
                    {rewardMe != null
                      ? rewardMe.nextTierRequiredCount > 0
                        ? `${rewardMe.orderCount}회 · 다음 등급까지 ${rewardMe.nextTierRequiredCount}회`
                        : `${rewardMe.orderCount}회 · 최고 등급`
                      : rewardLoading
                        ? '…'
                        : !getAccessToken()
                          ? '로그인 후 확인'
                          : rewardFetchFailed
                            ? '리워드 정보를 불러오지 못했습니다'
                            : '—'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.distanceGoalSection}>
            <div className={styles.distanceGoalCard}>
              <div className={styles.distanceGoalHeader}>
                <h3 className={styles.distanceGoalTitle}>
                  <span
                    className={`material-symbols-outlined ${styles.distanceGoalIcon}`}
                    style={{ color: tierTheme.myGoalIcon }}
                  >
                    military_tech
                  </span>
                  리워드 요약
                </h3>
                <span className={styles.distanceGoalBadge} style={{ color: tierTheme.myGoalBadgeColor }}>
                  XP {cumulativeXpDisplay != null ? cumulativeXpDisplay.toLocaleString('ko-KR') : '—'}
                </span>
              </div>
              <div className={styles.distanceGoalBarWrap}>
                <div
                  className={styles.distanceGoalBarFill}
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: tierTheme.myGoalBar,
                    boxShadow: tierTheme.myTierProgressGlow,
                  }}
                />
              </div>
              <p className={styles.distanceGoalDesc}>
                누적 주문 {rewardMe != null ? `${rewardMe.orderCount.toLocaleString('ko-KR')}회` : '—'} · 등급 코드{' '}
                {rewardMe?.tier ?? '—'}
              </p>
            </div>
          </section>

          <section ref={questSectionRef} className={styles.questSection}>
            <div className={styles.questHeader}>
              <h3 className={styles.questTitle}>
                <span className={`material-symbols-outlined ${styles.questIcon}`}>calendar_month</span>
                주간 퀘스트(출석체크)
              </h3>
              <span className={styles.questBadge}>
                {attendanceStreak > 0 ? `${attendanceStreak}일째 연속 출석 중!` : '연속 출석을 시작해 보세요!'}
              </span>
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
              <button type="button" className={styles.menuItem} onClick={() => onLogout?.()}>
                <div className={styles.menuLeft}>
                  <div className={`${styles.menuIconWrap} ${styles.menuIconGray}`}>
                    <span className="material-symbols-outlined">logout</span>
                  </div>
                  <span className={styles.menuLabel}>로그아웃</span>
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
        <AppModal open={showAttendanceModal} onClose={() => setShowAttendanceModal(false)} size="sm">
          <div className={styles.attendanceModalInner}>
            <div className={styles.modalIconWrap}>
              <span className={`material-symbols-outlined ${styles.modalIcon}`}>check_circle</span>
            </div>
            <h3 className={styles.modalTitle}>출석 완료!</h3>
            <p className={styles.modalDesc}>{attendanceModalMessage}</p>
            <p className={styles.modalSub}>
              🔥 {attendanceStreak > 0 ? `${attendanceStreak}일째 연속 출석 중이에요!` : '내일도 이어가면 연속 출석이 쌓여요!'}
            </p>
            <button type="button" onClick={() => setShowAttendanceModal(false)} className={styles.modalButton}>
              확인
            </button>
          </div>
        </AppModal>
      </div>
    </Layout>
  )
}

export default MyPage
