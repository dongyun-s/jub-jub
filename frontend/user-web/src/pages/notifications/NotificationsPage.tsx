/**
 * NotificationsPage.tsx
 * 주문·픽업 알림 — GET /order-tracking/notifications, POST .../read-all
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import {
  fetchOrderNotifications,
  postOrderNotificationsReadAll,
  type OrderNotificationItem,
} from '../../api/orderNotifications'
import { getAccessToken } from '../../lib/authStorage'

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
  cartCount?: number
}

function NotificationsPage({
  onBack,
  onGoHome,
  onCartClick,
  onOrdersClick,
  onMapClick,
  onMypageClick,
  cartCount = 0,
}: NotificationsPageProps) {
  const [items, setItems] = useState<OrderNotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!getAccessToken()) {
      setItems([])
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await fetchOrderNotifications()
      setItems(data.notifications)
      setError(null)
    } catch {
      setError('알림을 불러오지 못했습니다.')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const onFocus = () => {
      void load()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [load])

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items])

  /** 명세상 단건 읽음 API 없음 — 화면에서만 읽음 표시(새로고침 시 서버 상태로 덮임). 모두 읽음은 서버 반영. */
  const markAsRead = (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id && !n.read ? { ...n, read: true } : n)),
    )
  }

  const markAllRead = async () => {
    if (!getAccessToken() || unreadCount === 0) return
    setBusy(true)
    try {
      await postOrderNotificationsReadAll()
      await load()
    } catch {
      setError('모두 읽음 처리에 실패했습니다.')
    } finally {
      setBusy(false)
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
            onClick={() => void markAllRead()}
            disabled={loggedOut || loading || busy || unreadCount === 0}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none"
          >
            모두 읽음
          </button>
        </div>

        {loggedOut && (
          <div className="py-12 text-center text-sm text-slate-600">
            로그인 후 주문·픽업 알림을 확인할 수 있습니다.
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
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => markAsRead(n.id)}
                className={`w-full text-left rounded-2xl border px-4 py-3 transition ${
                  n.read ? 'bg-white border-slate-200' : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{n.title}</p>
                    {n.body ? (
                      <p className="mt-1 text-xs text-slate-600 leading-5">{n.body}</p>
                    ) : null}
                  </div>
                  {!n.read && (
                    <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  )}
                </div>
                <p className="mt-2 text-[11px] text-slate-500">{formatNotifyTime(n.createdAt)}</p>
              </button>
            ))}
          </div>
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
