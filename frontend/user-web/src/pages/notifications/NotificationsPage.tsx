/**
 * NotificationsPage.tsx — 통합 알림
 * - 카드 본문 탭: 읽음 처리
 * - 핑크 안내 문구 탭: 해당 화면으로 이동
 */

import { useEffect } from 'react'
import Layout from '../../components/Layout'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import {
  notificationTypeLabel,
  useUnifiedNotifications,
} from '../../hooks/useUnifiedNotifications'
import type { UnifiedNotificationItem } from '../../api/notifications'
import { getAccessToken } from '../../lib/authStorage'
import {
  notificationNavigateHint,
  resolveNotificationTarget,
  type NotificationNavigateTarget,
} from '../../lib/notificationNavigation'
import { notifyNotificationsUpdated } from '../../hooks/useUnreadNotificationCount'
import { notifyReviewNotificationsUpdated } from '../../hooks/useUnreadReviewNotificationCount'

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
    isMock,
    load,
    markAsRead,
    markAllRead,
  } = useUnifiedNotifications()

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

  const handleMarkAllRead = async () => {
    try {
      await markAllRead()
      bumpBadge()
    } catch {
      /* hook sets error */
    }
  }

  const loggedOut = !getAccessToken()

  return (
    <Layout showBackground={false}>
      <Header showBack onBack={onBack} title="알림" rightContent={null} />

      <div className="px-4 pt-3 pb-20">
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

              return (
                <article
                  key={n.id}
                  className={`rounded-2xl border overflow-hidden ${
                    n.read ? 'bg-white border-slate-200' : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleMarkReadOnly(n)}
                    disabled={n.read}
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
            })}
          </div>
        )}

        {!loggedOut && isMock && !loading && (
          <p className="mt-6 text-center text-[11px] text-slate-400">
            API 연동 시 .env 에 VITE_LIVE_API_NOTIFICATIONS=true
          </p>
        )}
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
    </Layout>
  )
}

export default NotificationsPage
