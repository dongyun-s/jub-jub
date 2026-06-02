/**
 * MyPage.tsx
 * 마이페이지 (탭: 내정보)
 * - 프로필·등급·이동거리·연속 출석(7일 rolling) 퀘스트, 주문내역/쿠폰/리뷰/찜 등 메뉴
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import Layout from '../../components/Layout'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import { useProfile } from '../../hooks/useProfile'
import AppModal from '../../components/AppModal/AppModal'
import mc from '../../components/AppModal/modalContent.module.css'
import AttendanceRandomBoxModal from '../../components/AttendanceRandomBoxModal/AttendanceRandomBoxModal'
import { ApiError } from '../../api/authClient'
import { createMyProfileImage, deleteMyProfileImage, updateMyProfileImage } from '../../api/profileImage'
import { uploadImageFileViaPresigned } from '../../api/uploads'
import {
  fetchAttendanceWeek,
  fetchAttendanceHistory,
  fetchRewardMe,
  postAttendanceCheck,
  type RewardMeResponse,
} from '../../api/rewards'
import { daysUntilRandomBoxStreak, sevenDayRewardCycleProgress } from '../../lib/attendanceRandomBox'
import { clearTokens, getAccessToken } from '../../lib/authStorage'
import {
  clearLocalAttendanceMark,
  syncAttendanceStreakFromServer,
  getAttendanceStreak,
  getWeekAttendanceCheckedLocally,
  isAttendanceMarkedDone,
  isoDateLocal,
  markAttendanceDone,
  weekIsoDatesMondayFirst,
} from '../../lib/rewardAttendance'
import TierIcon from '../../components/TierIcon/TierIcon'
import { getTierLabelEn, getTierTheme } from '../../lib/rewardTierTheme'
import { resolveDisplayImageUrl } from '../../lib/imageUrl'
import { useUnreadReviewNotificationCount } from '../../hooks/useUnreadReviewNotificationCount'
import { deleteMyAccount, updateMyProfile } from '../../api/users'
import styles from './MyPage.module.css'

interface MyPageProps {
  onGoHome?: () => void
  onCartClick?: () => void
  onOrdersClick?: () => void
  onCouponClick?: () => void
  onMapClick?: () => void
  onReviewsClick?: () => void
  onFavoritesClick?: () => void
  onRankingClick?: () => void
  onNotificationsClick?: () => void
  onLogout?: () => void
  cartCount?: number
}

/** 월요일=0 … 일요일=6 (서버 주간 병합·오늘 칸 동기화용) */
function todayWeekIndex(): number {
  return (new Date().getDay() + 6) % 7
}

function MyPage({ onGoHome, onCartClick, onOrdersClick, onCouponClick, onMapClick, onReviewsClick, onFavoritesClick, onRankingClick, onNotificationsClick, onLogout, cartCount = 0 }: MyPageProps) {
  const unreadReviewNotificationCount = useUnreadReviewNotificationCount()
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile()
  const avatarFileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  const [avatarDeleting, setAvatarDeleting] = useState(false)

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
  const [randomBoxOpen, setRandomBoxOpen] = useState(false)

  const questSectionRef = useRef<HTMLDivElement | null>(null)

  /** 개인정보 설정 (PUT /users/me, DELETE /users/me) */
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editNickname, setEditNickname] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [withdrawPassword, setWithdrawPassword] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)

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

  useEffect(() => {
    const onUpdated = () => {
      void loadRewards()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void loadRewards()
    }
    window.addEventListener('jubjub-rewards-updated', onUpdated)
    window.addEventListener('focus', onUpdated)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('jubjub-rewards-updated', onUpdated)
      window.removeEventListener('focus', onUpdated)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [loadRewards])

  const [attendanceStreak, setAttendanceStreak] = useState(0)

  /** 주간 그리드: 로컬 + 이번 달 history 1회만 (누적 출석 집계는 별도 effect) */
  useEffect(() => {
    if (typeof window === 'undefined' || profileLoading) return
    let cancelled = false

    const mergeWeek = (local: boolean[], api: boolean[] | null): boolean[] => {
      if (!api || api.length !== 7) return [...local]
      return local.map((v, i) => v || !!api[i])
    }

    const sync = async () => {
      const localWeek = getWeekAttendanceCheckedLocally(profile?.email)
      let merged = [...localWeek]
      const todayIso = isoDateLocal(new Date())
      let serverTodayAttended: boolean | null = null

      if (getAccessToken()) {
        const apiWeek = await fetchAttendanceWeek()
        if (!cancelled) merged = mergeWeek(merged, apiWeek)

        try {
          const now = new Date()
          const history = await fetchAttendanceHistory({
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          })
          if (!cancelled) {
            const set = new Set(history.attendedDates)
            serverTodayAttended = set.has(todayIso)
            syncAttendanceStreakFromServer(profile?.email, history.attendedDates)
            if (history.attendedDates.length > 0) {
              const weekDates = weekIsoDatesMondayFirst()
              const fromHistory = weekDates.map((d) => set.has(d))
              merged = mergeWeek(merged, fromHistory)
            }
            if (serverTodayAttended) {
              markAttendanceDone(profile?.email)
            } else {
              clearLocalAttendanceMark(profile?.email, todayIso)
              merged[todayIndex] = false
            }
          }
        } catch {
          /* 이번 달 history 실패 시 로컬만 */
        }
      }

      const todayDone =
        serverTodayAttended !== null && getAccessToken()
          ? serverTodayAttended
          : isAttendanceMarkedDone(profile?.email)
      if (!cancelled) {
        merged[todayIndex] = merged[todayIndex] || todayDone
        if (serverTodayAttended === false) merged[todayIndex] = false
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
  }, [profile?.email, todayIndex, profileLoading])

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

  const tierTheme = getTierTheme(rewardMe?.tier, rewardMe?.tierName)
  const tierLabelEn = getTierLabelEn(rewardMe?.tier, rewardMe?.tierName)

  const isTodayChecked = checkedDays[todayIndex]
  const { filledInCycle: streakFilledInCycle } = sevenDayRewardCycleProgress(attendanceStreak)
  const daysUntilRandomBox = daysUntilRandomBoxStreak(attendanceStreak)

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

  const handleDeleteAvatar = () => {
    if (!getAccessToken()) {
      alert('로그인 후 프로필 사진을 삭제할 수 있습니다.')
      return
    }
    if (!profileImageUrl) return
    if (!window.confirm('프로필 사진을 삭제할까요?')) return
    void (async () => {
      setAvatarDeleting(true)
      try {
        await deleteMyProfileImage()
        await refetchProfile()
      } catch (e) {
        alert(e instanceof ApiError ? e.message : '프로필 사진을 삭제하지 못했습니다.')
      } finally {
        setAvatarDeleting(false)
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
        const { message, isRandomBoxAvailable } = await postAttendanceCheck()
        markAttendanceDone(profile?.email)
        setCheckedDays((prev) => {
          const next = [...prev]
          next[todayIndex] = true
          return next
        })
        setAttendanceStreak(getAttendanceStreak(profile?.email))
        await loadRewards()

        if (isRandomBoxAvailable) {
          setRandomBoxOpen(true)
        } else {
          setAttendanceModalMessage(message || '출석체크가 완료되었습니다.')
          setShowAttendanceModal(true)
        }
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

  // 홈 출석 카드에서 진입한 경우에만 연속 출석 섹션을 화면 가운데로 스크롤
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

  const handleReviewsMenuClick = () => {
    onReviewsClick?.()
  }

  const openSettings = () => {
    if (!getAccessToken()) {
      alert('로그인 후 개인정보 설정을 이용할 수 있습니다.')
      return
    }
    setEditNickname(profile?.nickname?.trim() ?? '')
    setEditPhone(profile?.phone?.trim() ?? '')
    setWithdrawPassword('')
    setSettingsOpen(true)
  }

  const handleSaveSettings = () => {
    if (!getAccessToken()) return
    const nextNickname = editNickname.trim()
    const nextPhone = editPhone.trim()
    // 부분 수정: 변경이 없으면 요청 생략
    const nicknameChanged = nextNickname !== (profile?.nickname?.trim() ?? '')
    const phoneChanged = nextPhone !== (profile?.phone?.trim() ?? '')
    if (!nicknameChanged && !phoneChanged) {
      setSettingsOpen(false)
      return
    }
    void (async () => {
      setSettingsSaving(true)
      try {
        await updateMyProfile({
          ...(nicknameChanged ? { nickname: nextNickname || null } : {}),
          ...(phoneChanged ? { phone: nextPhone || null } : {}),
        })
        await refetchProfile()
        alert('프로필이 수정되었습니다.')
        setSettingsOpen(false)
      } catch (e) {
        alert(e instanceof ApiError ? e.message : '프로필을 수정하지 못했습니다.')
      } finally {
        setSettingsSaving(false)
      }
    })()
  }

  const handleWithdraw = () => {
    if (!getAccessToken()) return
    const pw = withdrawPassword.trim()
    if (!pw) {
      alert('비밀번호를 입력해 주세요.')
      return
    }
    if (!window.confirm('정말 탈퇴하시겠어요?\n탈퇴 후에는 로그아웃됩니다.')) return
    void (async () => {
      setWithdrawing(true)
      try {
        await deleteMyAccount(pw)
        clearTokens()
        alert('탈퇴 처리되었습니다. 이용해 주셔서 감사합니다.')
        setSettingsOpen(false)
        onLogout?.()
      } catch (e) {
        alert(e instanceof ApiError ? e.message : '탈퇴를 처리하지 못했습니다.')
      } finally {
        setWithdrawing(false)
      }
    })()
  }

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
                <TierIcon
                  tier={rewardMe?.tier}
                  tierName={rewardMe?.tierName}
                  size="xs"
                  alt=""
                />
                {profileGradeBadge}
              </div>
            </div>
            {getAccessToken() && profileImageUrl ? (
              <div className={styles.avatarActions}>
                <button
                  type="button"
                  className={styles.avatarActionBtn}
                  onClick={() => setImagePreviewOpen(true)}
                >
                  전체보기
                </button>
                <span className={styles.avatarActionSep} aria-hidden>
                  |
                </span>
                <button
                  type="button"
                  className={`${styles.avatarActionBtn} ${styles.avatarActionDanger}`}
                  disabled={avatarDeleting || avatarUploading}
                  onClick={handleDeleteAvatar}
                >
                  {avatarDeleting ? '삭제 중…' : '삭제'}
                </button>
              </div>
            ) : null}
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
                  <TierIcon
                    tier={rewardMe?.tier}
                    tierName={rewardMe?.tierName}
                    size="sm"
                    glow
                    className={styles.distanceGoalIcon}
                    alt=""
                  />
                  리워드 요약
                </h3>
                <span className={styles.distanceGoalBadge} style={{ color: tierTheme.myGoalBadgeColor }}>
                  {rewardMe != null
                    ? `${rewardMe.orderCount.toLocaleString('ko-KR')}회 픽업`
                    : rewardLoading
                      ? '…'
                      : '—'}
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
                연속 출석 퀘스트
              </h3>
              <span className={styles.questBadge}>
                {attendanceStreak > 0 ? `${attendanceStreak}일째 연속 출석 중!` : '연속 출석을 시작해 보세요!'}
              </span>
            </div>
            <p className={styles.questSubtext}>
              요일과 관계없이 매일 이어지면 카운트돼요. 연속 7일마다 랜덤박스를 열 수 있어요.
            </p>
            {daysUntilRandomBox > 0 && (
              <p className={styles.randomBoxHint}>
                7일 연속 달성까지 · {daysUntilRandomBox}일 남음
              </p>
            )}
            {daysUntilRandomBox === 0 && attendanceStreak > 0 && (
              <p className={styles.randomBoxHintReady}>7일 연속 달성! 출석 후 랜덤박스를 확인해 보세요.</p>
            )}
            <div className={styles.streakSevenRow} role="list" aria-label="연속 7일 출석 진행">
              {Array.from({ length: 7 }, (_, i) => {
                const step = i + 1
                const done = streakFilledInCycle >= step
                return (
                  <div key={step} className={styles.streakStep} role="listitem">
                    <div
                      className={`${styles.streakStepDot} ${done ? styles.streakStepDotDone : styles.streakStepDotTodo}`}
                      aria-label={`${step}/7 ${done ? '완료' : '미완료'}`}
                    >
                      {done ? (
                        <span className={`material-symbols-outlined ${styles.streakStepIcon}`}>check</span>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className={styles.attendanceTodayRow}>
              <button
                type="button"
                onClick={handleAttendanceCheck}
                disabled={isTodayChecked}
                className={`${styles.todayAttendanceCta} ${isTodayChecked ? styles.todayAttendanceCtaDone : styles.todayAttendanceCtaTodo}`}
              >
                {isTodayChecked ? (
                  <>
                    <span className={`material-symbols-outlined ${styles.todayAttendanceCtaIcon}`}>check_circle</span>
                    오늘 출석 완료
                  </>
                ) : (
                  <>
                    <span className={`material-symbols-outlined ${styles.todayAttendanceCtaIcon}`}>star</span>
                    오늘 출석하기
                  </>
                )}
              </button>
            </div>
            {!isTodayChecked && (
              <p className={styles.attendanceHint}>매일 한 번만 눌러도 연속이 이어져요.</p>
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
                <span className={`material-symbols-outlined ${styles.chevron}`}>chevron_right</span>
              </button>
              <button type="button" onClick={handleReviewsMenuClick} className={styles.menuItem}>
                <div className={styles.menuLeft}>
                  <div className={`${styles.menuIconWrap} ${styles.menuIconEmerald}`}>
                    <span className="material-symbols-outlined">rate_review</span>
                  </div>
                  <span className={styles.menuLabel}>리뷰 관리</span>
                </div>
                <div className={styles.menuRight}>
                  {unreadReviewNotificationCount > 0 && (
                    <span className={styles.newBadge}>NEW</span>
                  )}
                  <span className={`material-symbols-outlined ${styles.chevron}`}>chevron_right</span>
                </div>
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
              <button type="button" onClick={() => onRankingClick?.()} className={styles.menuItem}>
                <div className={styles.menuLeft}>
                  <div className={`${styles.menuIconWrap} ${styles.menuIconViolet}`}>
                    <span className="material-symbols-outlined">leaderboard</span>
                  </div>
                  <span className={styles.menuLabel}>회원 랭킹</span>
                </div>
                <span className={`material-symbols-outlined ${styles.chevron}`}>chevron_right</span>
              </button>
              <button type="button" className={styles.menuItem} onClick={openSettings}>
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
        <AppModal
          open={imagePreviewOpen}
          onClose={() => setImagePreviewOpen(false)}
          size="lg"
          flush
          aria-labelledby="profile-image-preview-title"
        >
          <div className={`${mc.center} ${mc.flushBody}`}>
            <h3 id="profile-image-preview-title" className={mc.titleCenter}>
              프로필 사진
            </h3>
            {profileImageUrl ? (
              <img src={profileImageUrl} alt="프로필 사진 전체 보기" className={styles.imagePreviewImg} />
            ) : null}
            <button type="button" className={mc.btnSecondary} onClick={() => setImagePreviewOpen(false)}>
              닫기
            </button>
          </div>
        </AppModal>

        <AttendanceRandomBoxModal
          open={randomBoxOpen}
          onClose={() => setRandomBoxOpen(false)}
          onGoCoupons={onCouponClick}
        />

        <AppModal open={showAttendanceModal} onClose={() => setShowAttendanceModal(false)} size="sm">
          <div className={mc.center}>
            <div className={mc.iconWrapLarge} aria-hidden>
              <span className={`material-symbols-outlined ${mc.icon} ${mc.iconFill} ${mc.iconLarge}`}>
                check_circle
              </span>
            </div>
            <h3 className={mc.titleCenter}>출석 완료!</h3>
            <p className={mc.messageCenter}>{attendanceModalMessage}</p>
            <p className={mc.submessage}>
              🔥 {attendanceStreak > 0 ? `${attendanceStreak}일째 연속 출석 중이에요!` : '내일도 이어가면 연속 출석이 쌓여요!'}
            </p>
            <button type="button" onClick={() => setShowAttendanceModal(false)} className={mc.btnPrimary}>
              확인
            </button>
          </div>
        </AppModal>

        <AppModal
          open={settingsOpen}
          onClose={() => !settingsSaving && !withdrawing && setSettingsOpen(false)}
          size="md"
        >
          <div>
            <h3 className={mc.titleLeft}>개인정보 설정</h3>
            <div className={mc.field}>
              <label className={mc.label}>닉네임</label>
              <input
                className={mc.input}
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                placeholder="닉네임"
                disabled={settingsSaving || withdrawing}
              />
            </div>
            <div className={mc.field}>
              <label className={mc.label}>휴대폰 번호</label>
              <input
                className={mc.input}
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="010-1234-5678"
                disabled={settingsSaving || withdrawing}
              />
              <p className={mc.hint}>하이픈 포함/미포함 모두 가능해요.</p>
            </div>

            <div className={mc.btnStack}>
              <button
                type="button"
                className={mc.btnPrimary}
                disabled={settingsSaving || withdrawing}
                onClick={handleSaveSettings}
              >
                {settingsSaving ? '저장 중…' : '저장'}
              </button>
              <button
                type="button"
                className={mc.btnSecondary}
                disabled={settingsSaving || withdrawing}
                onClick={() => setSettingsOpen(false)}
              >
                닫기
              </button>
            </div>

            <div className={mc.sectionDivider}>
              <h4 className={mc.sectionTitle}>회원 탈퇴</h4>
              <p className={mc.sectionDesc}>비밀번호 확인 후 탈퇴 처리됩니다.</p>
              <input
                className={mc.input}
                type="password"
                value={withdrawPassword}
                onChange={(e) => setWithdrawPassword(e.target.value)}
                placeholder="비밀번호"
                disabled={settingsSaving || withdrawing}
              />
              <button
                type="button"
                className={`${mc.btnDanger} ${styles.withdrawBtnSpaced}`}
                disabled={settingsSaving || withdrawing}
                onClick={handleWithdraw}
              >
                {withdrawing ? '탈퇴 처리 중…' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </AppModal>
      </div>
    </Layout>
  )
}

export default MyPage
