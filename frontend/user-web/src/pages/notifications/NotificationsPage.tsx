/**
 * NotificationsPage.tsx — 통합 알림
 * - 세로 드래그/스크롤로 목록 탐색
 * - 가로 밀기: 읽음 처리 (설정 on/off)
 */

import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import NotificationSwipeCard from '../../components/NotificationSwipeCard/NotificationSwipeCard'
import {
  notificationTypeLabel,
  useUnifiedNotifications,
} from '../../hooks/useUnifiedNotifications'
import { useVerticalDragScroll } from '../../hooks/useVerticalDragScroll'
import type { UnifiedNotificationItem } from '../../api/notifications'
import { getAccessToken } from '../../lib/authStorage'
import {
  isNotificationSwipeReadEnabled,
  setNotificationSwipeReadEnabled,
} from '../../lib/notificationSwipePrefs'
import {
  notificationNavigateHint,
  resolveNotificationTarget,
  type NotificationNavigateTarget,
} from '../../lib/notificationNavigation'
import { notifyNotificationsUpdated } from '../../hooks/useUnreadNotificationCount'
import { notifyReviewNotificationsUpdated } from '../../hooks/useUnreadReviewNotificationCount'
import styles from './NotificationsPage.module.css'

function formatNotifyTime(isoOrRaw: string): string {
  if (!isoOrRaw.trim()) return ''
  const t = Date.parse(isoOrRaw)
  if (!Number.isNaN(t)) {
    return new Date(t).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  return isoOrRaw
}

interface NotificationsPageProps {
  onBack?: () => void
  onGoHome?: () => void
  onCartClick?: () => void
  onOrdersClick?: () => void
  onMapClick?: () => void
  onMypageClick?: () => void
  onNavigate?: (target: NotificationNavigateTarget) => void
  cartCount?: number
}

function NotificationsPage({
  onBack,
  onGoHome,
  onCartClick,
  onOrdersClick,
  onMapClick,
  onMypageClick,
  onNavigate,
  cartCount = 0,
}: NotificationsPageProps) {
  const {
    items,
    unreadCount,
    loading,
    error,
    load,
    markAsRead,
    markAllRead,
  } = useUnifiedNotifications()

  const { scrollRef, isDragging, handlers: scrollHandlers, captureHandlers } = useVerticalDragScroll()
  const [swipeReadEnabled, setSwipeReadEnabled] = useState(() => isNotificationSwipeReadEnabled())

  useEffect(() => {
    if (!getAccessToken()) return
    void load()
  }, [load])

  useEffect(() => {
    const onFocus = () => {
      if (getAccessToken()) void load()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [load])

  const bumpBadge = () => {
    notifyNotificationsUpdated()
    notifyReviewNotificationsUpdated()
  }

  const handleMarkReadOnly = (item: UnifiedNotificationItem) => {
    if (item.read) return
    void markAsRead(item).then(bumpBadge).catch(() => {
      /* hook sets error */
    })
  }

  const handleNavigateOnly = (item: UnifiedNotificationItem) => {
    if (!onNavigate) return
    void (async () => {
      try {
        const target = await resolveNotificationTarget(item)
        onNavigate(target)
      } catch {
        /* ignore */
      }
    })()
  }

  const isCouponNotification = (item: UnifiedNotificationItem) =>
    item.type === 'COUPON_ISSUED' || item.type === 'COUPON_EXPIRING'

  const handleCardClick = (item: UnifiedNotificationItem) => {
    if (isCouponNotification(item) && onNavigate) {
      if (!item.read) {
        void markAsRead(item).then(bumpBadge).catch(() => {
          /* ignore */
        })
      }
      handleNavigateOnly(item)
      return
    }
    handleMarkReadOnly(item)
  }

  const handleSwipeRead = (item: UnifiedNotificationItem) => {
    if (item.read) return
    void markAsRead(item).then(bumpBadge).catch(() => {
      /* hook sets error */
    })
  }

  const toggleSwipeRead = () => {
    const next = !swipeReadEnabled
    setSwipeReadEnabled(next)
    setNotificationSwipeReadEnabled(next)
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllRead()
      bumpBadge()
    } catch {
      /* hook sets error */
    }
  }

  const loggedOut = !getAccessToken()

  const handleBack = () => {
    if (onBack) {
      onBack()
      return
    }
    onGoHome?.()
  }

  return (
    <Layout showBackground={false}>
      <div className={styles.page}>
        <Header showBack onBack={handleBack} title="알림" rightContent={null} />

        <div
          ref={scrollRef}
          className={`${styles.scrollArea} ${isDragging ? styles.scrollAreaDragging : styles.scrollAreaIdle}`}
          {...scrollHandlers}
          {...captureHandlers}
        >
          <p className={styles.scrollHint}>위·아래로 드래그해 알림 목록을 볼 수 있어요</p>

          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-600">
              읽지 않은 알림{' '}
              <span className="font-bold text-slate-900">{loggedOut ? 0 : unreadCount}</span>개
            </p>
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              disabled={loggedOut || loading || unreadCount === 0}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none"
            >
              모두 읽음
            </button>
          </div>

          {!loggedOut && (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800">밀어서 읽음 처리</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  카드를 잡고 오른쪽으로 밀면 읽음 · 위아래로 드래그하면 목록 이동
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={swipeReadEnabled}
                onClick={toggleSwipeRead}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                  swipeReadEnabled ? 'bg-primary' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    swipeReadEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {loggedOut && (
            <div className="py-12 text-center text-sm text-slate-600">
              로그인 후 주문·리뷰·쿠폰 알림을 확인할 수 있습니다.
            </div>
          )}

          {!loggedOut && error && (
            <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-center justify-between gap-2">
              <span>{error}</span>
              <button type="button" className="font-semibold shrink-0" onClick={() => void load()}>
                다시 시도
              </button>
            </div>
          )}

          {!loggedOut && loading && (
            <div className="py-16 text-center text-sm text-slate-500">불러오는 중…</div>
          )}

          {!loggedOut && !loading && items.length === 0 && !error && (
            <div className="py-16 text-center text-sm text-slate-500">알림이 없습니다.</div>
          )}

          {!loggedOut && !loading && items.length > 0 && (
            <div className="space-y-3">
              {items.map((n) => {
                const hint = notificationNavigateHint(n)
                const canGo = Boolean(onNavigate && hint)

                const cardInner = (
                  <article
                    className={`rounded-2xl border overflow-hidden ${
                      n.read ? 'bg-white border-slate-200' : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleCardClick(n)}
                      disabled={n.read && !isCouponNotification(n)}
                      className={`w-full text-left px-4 py-3 transition ${
                        n.read ? 'cursor-default' : 'hover:bg-black/[0.02] active:bg-black/[0.04]'
                      }`}
                      aria-label={n.read ? `${n.title}, 읽음` : `${n.title}, 탭하여 읽음 처리`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          {notificationTypeLabel(n.type)}
                        </span>
                        {!n.read && (
                          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-900">{n.title}</p>
                      {n.body ? (
                        <p className="mt-1 text-xs text-slate-600 leading-5">{n.body}</p>
                      ) : null}
                      {n.couponAmount != null && n.couponAmount > 0 && (
                        <p className="mt-1 text-xs font-semibold text-amber-800">
                          {n.couponAmount.toLocaleString('ko-KR')}원
                        </p>
                      )}
                      <p className="mt-2 text-[11px] text-slate-500">{formatNotifyTime(n.createdAt)}</p>
                    </button>

                    {canGo && (
                      <div className="px-4 pb-3 pt-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNavigateOnly(n)
                          }}
                          className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary"
                        >
                          {hint}
                          <span className="material-symbols-outlined text-base" aria-hidden>
                            chevron_right
                          </span>
                        </button>
                      </div>
                    )}
                  </article>
                )

                return (
                  <NotificationSwipeCard
                    key={n.id}
                    enabled={swipeReadEnabled}
                    read={n.read}
                    onSwipeRead={() => handleSwipeRead(n)}
                  >
                    {cardInner}
                  </NotificationSwipeCard>
                )
              })}
            </div>
          )}

          {/* mock 표시 제거 */}
        </div>

        <BottomNav
          active="home"
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

export default NotificationsPage
