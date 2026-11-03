import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { OwnerHeader } from '../../components/OwnerHeader'
import { Icon } from '../../components/Icon'
import { ApiError } from '../../api/authClient'
import { fetchOwnerDashboard, type OwnerDashboardDto } from '../../api/owner/dashboard'
import { useOwnerOrders } from '../../context/OwnerOrdersProvider'
import { useOwnerSales } from '../../context/OwnerSalesProvider'
import { useOwnerMockData } from '../../lib/ownerConfig'
import {
  buildWeeklySalesPaths,
  formatTrendPct,
  formatWon,
  reviewRelativeLabel,
} from '../../lib/dashboardStats'
import { MOCK_DASHBOARD } from '../../lib/mocks/ownerMockData'
import { getActiveOwnerStoreProfile } from '../../lib/ownerSession'
import { formatPrice } from '../../lib/format'
import styles from './DashboardPage.module.css'

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'] as const

function weeklyAmountsFromApi(weekly: OwnerDashboardDto['weeklySales'] | undefined): number[] {
  const byDow = [0, 0, 0, 0, 0, 0, 0]
  for (const row of weekly ?? []) {
    const d = new Date(row.date)
    if (Number.isNaN(d.getTime())) continue
    const js = d.getDay()
    const idx = js === 0 ? 6 : js - 1
    byDow[idx] = row.salesAmount
  }
  return byDow
}

type RankMenu = { rank: number | string; name: string; orders: number; price: number }

export function DashboardPage() {
  const useMock = useOwnerMockData()
  const {
    salesPaused,
    resumeSales,
    isScheduledPause,
    remainingMinutesLabel,
    formatResumeAtLabel,
    storeName: salesStoreName,
  } = useOwnerSales()
  const { newOrders, activeOrders, useMock: ordersMock } = useOwnerOrders()
  const ownerProfile = getActiveOwnerStoreProfile()

  const [weekTab, setWeekTab] = useState<'this' | 'last'>('this')
  const [dash, setDash] = useState<OwnerDashboardDto | null>(null)
  const [dashLoading, setDashLoading] = useState(!useMock)
  const [dashError, setDashError] = useState<string | null>(null)

  useEffect(() => {
    if (useMock) {
      setDash(null)
      setDashLoading(false)
      setDashError(null)
      return
    }
    let cancelled = false
    setDashLoading(true)
    ;(async () => {
      try {
        const data = await fetchOwnerDashboard()
        if (!cancelled) {
          setDash(data)
          setDashError(null)
        }
      } catch (e) {
        if (!cancelled) {
          setDash(null)
          const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : '대시보드를 불러오지 못했습니다.'
          setDashError(msg)
        }
      } finally {
        if (!cancelled) setDashLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [useMock])

  const storeLabel = salesStoreName || dash?.storeName || ownerProfile?.storeName
  const liveOrdersInProgress = newOrders.length + activeOrders.length

  const metrics = useMemo(() => {
    if (useMock) {
      return {
        todaySales: MOCK_DASHBOARD.todaySales,
        salesTrendPct: MOCK_DASHBOARD.salesTrendPct,
        orderCount: MOCK_DASHBOARD.orderCount,
        inProgress: liveOrdersInProgress,
      }
    }
    if (dash) {
      return {
        todaySales: dash.todaySales,
        salesTrendPct: 0,
        orderCount: dash.todayOrderCount,
        inProgress: Math.max(dash.activeOrderCount, liveOrdersInProgress),
      }
    }
    return {
      todaySales: 0,
      salesTrendPct: 0,
      orderCount: 0,
      inProgress: liveOrdersInProgress,
    }
  }, [useMock, dash, liveOrdersInProgress])

  const weeklyValues = useMemo(() => {
    if (useMock) {
      return weekTab === 'this' ? MOCK_DASHBOARD.weeklyThisWeek : MOCK_DASHBOARD.weeklyLastWeek
    }
    if (dash) return weeklyAmountsFromApi(dash.weeklySales)
    return [0, 0, 0, 0, 0, 0, 0]
  }, [useMock, dash, weekTab])

  const chartPaths = useMemo(() => buildWeeklySalesPaths(weeklyValues), [weeklyValues])
  const weeklyHasData = weeklyValues.some((v) => v > 0)

  const bestMenus = useMemo((): RankMenu[] => {
    if (useMock) return MOCK_DASHBOARD.bestMenus
    if (!dash) return []
    return dash.bestMenus.slice(0, 5).map((m, i) => ({
      rank: i + 1,
      name: m.menuName,
      orders: m.orderQuantity,
      price: m.salesAmount,
    }))
  }, [useMock, dash])

  const avgRating = useMock ? null : (dash?.averageRating ?? null)
  const recentReviews = useMemo(() => {
    if (useMock) return []
    return dash?.recentReviews?.slice(0, 2) ?? []
  }, [useMock, dash])

  return (
    <>
      <OwnerHeader
        title="대시보드"
        subtitle={useMock || ordersMock ? `${storeLabel ?? ''} · 예시 데이터` : storeLabel}
      />
      <main className={styles.main}>
        {dashError ? (
          <p className={styles.errorBanner} role="alert">
            대시보드 API: {dashError}
          </p>
        ) : null}
        {dashLoading ? <p className={styles.trendHint}>대시보드 불러오는 중…</p> : null}

        {salesPaused ? (
          <div className={styles.warningBanner}>
            <div className={styles.warningLeft}>
              <Icon name="warning" style={{ fontSize: '1.875rem', color: '#f97316' }} />
              <div>
                <h4 className={styles.warningTitle}>
                  {isScheduledPause ? '일시 중지 중입니다' : '현재 영업이 중지된 상태입니다'}
                </h4>
                <p className={styles.warningText}>
                  {isScheduledPause && remainingMinutesLabel ? (
                    <>
                      <strong className={styles.warningStrong}>{remainingMinutesLabel}</strong>
                      {formatResumeAtLabel() ? ` · ${formatResumeAtLabel()} 재개` : null}.{' '}
                    </>
                  ) : (
                    <>고객이 메뉴를 주문할 수 없습니다. </>
                  )}
                  <Link to="/sales" className={styles.warningLink}>
                    영업 상태
                  </Link>
                  에서 변경·재개할 수 있습니다.
                </p>
              </div>
            </div>
            <button type="button" className={styles.resumeBtn} onClick={resumeSales}>
              영업 재개하기
            </button>
          </div>
        ) : (
          <div className={styles.openBanner}>
            <div className={styles.openLeft}>
              <span className={styles.openDot} aria-hidden />
              <div>
                <h4 className={styles.openTitle}>영업 중</h4>
                <p className={styles.openText}>주문을 받고 있습니다. 필요하면 일시 중지할 수 있습니다.</p>
              </div>
            </div>
            <Link to="/sales" className={styles.pauseLink}>
              영업 일시정지
            </Link>
          </div>
        )}

        <section className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricTop}>
              <span className={styles.metricLabel}>오늘 매출액</span>
              <div className={`${styles.metricIconWrap} ${styles.metricIconWrapPink}`}>
                <Icon name="payments" />
              </div>
            </div>
            <div>
              <h2 className={styles.metricValue}>{formatWon(metrics.todaySales)}</h2>
              {metrics.salesTrendPct !== 0 ? (
                <div className={styles.trendRow}>
                  <span className={styles.trendUpPink}>
                    <Icon name="trending_up" />
                    {formatTrendPct(metrics.salesTrendPct)}
                  </span>
                  <span className={styles.trendHint}>전일 대비 증가</span>
                </div>
              ) : (
                <p className={styles.trendHint}>{useMock ? '예시 매출' : '오늘 매출'}</p>
              )}
            </div>
            <div className={styles.blurOrb} aria-hidden />
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricTop}>
              <span className={styles.metricLabel}>총 주문 수</span>
              <div className={`${styles.metricIconWrap} ${styles.metricIconWrapViolet}`}>
                <Icon name="order_approve" />
              </div>
            </div>
            <div>
              <h2 className={styles.metricValue}>
                {metrics.orderCount.toLocaleString('ko-KR')}{' '}
                <span className={styles.metricSub}>건</span>
              </h2>
              <p className={styles.trendHint}>오늘 주문</p>
            </div>
          </div>
          <div className={`${styles.metricCard} ${styles.metricCardAccent}`}>
            <div className={styles.metricTop}>
              <span className={styles.metricLabel}>실시간 픽업</span>
              <div className={`${styles.metricIconWrap} ${styles.metricIconWrapPulse}`}>
                <Icon name="shopping_bag" />
              </div>
            </div>
            <div>
              <h2 className={styles.metricValue}>
                {metrics.inProgress} <span className={styles.metricSub}>진행중</span>
              </h2>
              <p className={styles.trendHint}>
                신규 {newOrders.length} · 조리/픽업대기 {activeOrders.length}
              </p>
            </div>
          </div>
        </section>

        <section className={styles.chartSection}>
          <div className={styles.chartCard}>
            <div className={styles.chartHead}>
              <div className={styles.chartHeadText}>
                <h3 className={styles.chartTitle}>주간 매출 트렌드</h3>
                <p className={styles.chartDesc}>
                  {!useMock && !weeklyHasData && !dashLoading ? '이번 주 매출 데이터가 아직 없습니다.' : '최근 매출 변화'}
                </p>
              </div>
              {useMock ? (
                <div className={styles.chartTabs}>
                  <button
                    type="button"
                    className={weekTab === 'this' ? styles.tabActive : styles.tabIdle}
                    onClick={() => setWeekTab('this')}
                  >
                    이번주
                  </button>
                  <button
                    type="button"
                    className={weekTab === 'last' ? styles.tabActive : styles.tabIdle}
                    onClick={() => setWeekTab('last')}
                  >
                    지난주
                  </button>
                </div>
              ) : null}
            </div>
            <div className={styles.chartPlot}>
              <div className={styles.chartBody}>
                <div className={styles.gridLines}>
                  <div className={styles.gridLine} />
                  <div className={styles.gridLine} />
                  <div className={styles.gridLine} />
                  <div className={`${styles.gridLine} ${styles.gridLineStrong}`} />
                </div>
                <div className={styles.svgWrap}>
                  <svg className={styles.svg} viewBox="0 0 1000 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="line-grad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#FF4D8D" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#FF4D8D" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d={chartPaths.line}
                      fill="none"
                      stroke="#FF4D8D"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="4"
                    />
                    <path d={chartPaths.area} fill="url(#line-grad)" />
                  </svg>
                </div>
                <div className={styles.dayLabels}>
                  {DAY_LABELS.map((d) => (
                    <span key={d}>{d}요일</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.bottomGrid}>
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>
              <Icon name="workspace_premium" style={{ color: 'var(--owner-primary)' }} />
              베스트 메뉴 순위
            </h3>
            <div className={styles.rankList}>
              {bestMenus.length === 0 ? (
                <p className={styles.trendHint}>
                  {dashLoading ? '불러오는 중…' : '아직 베스트 메뉴 데이터가 없습니다.'}
                </p>
              ) : (
                bestMenus.map((m) => (
                  <div key={`${m.rank}-${m.name}`} className={styles.rankRow}>
                    <div className={styles.rankNum}>{m.rank}</div>
                    <div className={styles.rankThumb} />
                    <div className={styles.rankInfo}>
                      <h4 className={styles.rankName}>{m.name}</h4>
                      <p className={styles.rankMeta}>주문 {m.orders}건</p>
                    </div>
                    <div className={styles.rankPrice}>{formatPrice(m.price)}</div>
                  </div>
                ))
              )}
            </div>
            <Link to="/menu" className={styles.linkReviews}>
              메뉴 관리 보기
            </Link>
          </div>
          <div className={styles.reviewsPanel}>
            <div className={styles.reviewsHead}>
              <h3 className={styles.reviewsTitleRow}>
                <Icon name="forum" style={{ color: 'var(--owner-secondary)' }} />
                최근 리뷰 요약
              </h3>
              <div className={styles.ratingPill}>
                <Icon name="star" filled style={{ fontSize: '0.875rem', color: 'var(--owner-primary)' }} />
                <span className={styles.ratingNum}>
                  {avgRating != null && avgRating > 0 ? avgRating.toFixed(1) : '—'}
                </span>
              </div>
            </div>
            <div className={styles.reviewCards}>
              {recentReviews.length === 0 ? (
                <p className={styles.trendHint}>
                  {useMock
                    ? '예시 모드에서는 리뷰 API를 사용하지 않습니다.'
                    : dashLoading
                      ? '불러오는 중…'
                      : '아직 리뷰가 없습니다.'}
                </p>
              ) : (
                recentReviews.map((r, i) => (
                  <div key={r.reviewId} className={i === 0 ? styles.glassCard : styles.reviewCardMuted}>
                    <div className={styles.reviewCardTop}>
                      <span className={styles.reviewUser}>★ {r.overallRating}</span>
                      <span className={styles.reviewTime}>{reviewRelativeLabel(r.createdAt)}</span>
                    </div>
                    <p className={styles.reviewBody}>{r.content || '내용 없음'}</p>
                  </div>
                ))
              )}
            </div>
            <Link to="/reviews" className={styles.linkReviews}>
              전체 리뷰 보기
            </Link>
          </div>
        </section>
      </main>

      <Link to="/orders" className={styles.fab} title="실시간 주문">
        <Icon name="receipt_long" className={styles.fabIcon} />
      </Link>
    </>
  )
}
