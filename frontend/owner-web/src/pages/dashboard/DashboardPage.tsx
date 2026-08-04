import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { OwnerHeader } from '../../components/OwnerHeader'
import { Icon } from '../../components/Icon'
import { useOwnerOrders } from '../../context/OwnerOrdersProvider'
import { useOwnerSales } from '../../context/OwnerSalesProvider'
import { useOwnerReviews } from '../../hooks/useOwnerReviews'
import { useOwnerStoreDetail } from '../../hooks/useOwnerStoreDetail'
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

export function DashboardPage() {
  const {
    salesPaused,
    resumeSales,
    isScheduledPause,
    remainingMinutesLabel,
    formatResumeAtLabel,
  } = useOwnerSales()
  const { store, mockMode } = useOwnerStoreDetail()
  const { orders, newOrders, activeOrders, completedOrders, useMock } = useOwnerOrders()
  const { reviews } = useOwnerReviews()
  const ownerProfile = getActiveOwnerStoreProfile()

  const [weekTab, setWeekTab] = useState<'this' | 'last'>('this')

  const storeLabel = ownerProfile?.storeName || store?.name

  const metrics = useMemo(() => {
    const inProgress = newOrders.length + activeOrders.length
    const liveSales = orders.reduce((sum, o) => sum + (o.total || o.amount || 0), 0)
    const liveOrderCount = orders.length

    if (useMock) {
      // 예시: 베이스 mock + 현재 보드 주문 반영
      const boardSales = liveSales
      const todaySales = Math.max(MOCK_DASHBOARD.todaySales, boardSales)
      const orderCount = Math.max(MOCK_DASHBOARD.orderCount, liveOrderCount + completedOrders.length)
      return {
        todaySales,
        salesTrendPct: MOCK_DASHBOARD.salesTrendPct,
        orderCount,
        orderTrendPct: MOCK_DASHBOARD.orderTrendPct,
        inProgress,
      }
    }

    return {
      todaySales: liveSales,
      salesTrendPct: 0,
      orderCount: liveOrderCount,
      orderTrendPct: 0,
      inProgress,
    }
  }, [useMock, orders, newOrders.length, activeOrders.length, completedOrders.length])

  const weeklyValues =
    weekTab === 'this' ? MOCK_DASHBOARD.weeklyThisWeek : MOCK_DASHBOARD.weeklyLastWeek
  const chartPaths = useMemo(() => buildWeeklySalesPaths(weeklyValues), [weeklyValues])

  const bestMenus = MOCK_DASHBOARD.bestMenus

  const avgRating = useMemo(() => {
    if (!reviews.length) return null
    const sum = reviews.reduce((s, r) => s + (r.overallRating || 0), 0)
    return Math.round((sum / reviews.length) * 10) / 10
  }, [reviews])

  const recentReviews = useMemo(() => {
    return [...reviews]
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return tb - ta
      })
      .slice(0, 2)
  }, [reviews])

  return (
    <>
      <OwnerHeader
        title="대시보드"
        subtitle={
          mockMode
            ? `${storeLabel ?? ''} · 예시 데이터`
            : storeLabel
        }
      />
      <main className={styles.main}>
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
                <p className={styles.trendHint}>오늘 주문 합계 기준</p>
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
              {metrics.orderTrendPct !== 0 ? (
                <div className={styles.trendRow}>
                  <span className={styles.trendUpViolet}>
                    <Icon name="trending_up" />
                    {formatTrendPct(metrics.orderTrendPct)}
                  </span>
                  <span className={styles.trendHint}>전일 동시간 대비</span>
                </div>
              ) : (
                <p className={styles.trendHint}>오늘 접수·진행·완료 합계</p>
              )}
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
                <p className={styles.chartDesc}>최근 7일간의 수익 변화 추이</p>
              </div>
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
              {bestMenus.map((m) => (
                <div key={m.rank} className={styles.rankRow}>
                  <div className={styles.rankNum}>{m.rank}</div>
                  <div className={styles.rankThumb} />
                  <div className={styles.rankInfo}>
                    <h4 className={styles.rankName}>{m.name}</h4>
                    <p className={styles.rankMeta}>주간 주문 {m.orders}건</p>
                  </div>
                  <div className={styles.rankPrice}>{formatPrice(m.price)}</div>
                </div>
              ))}
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
                <span className={styles.ratingNum}>{avgRating != null ? avgRating.toFixed(1) : '—'}</span>
              </div>
            </div>
            <div className={styles.reviewCards}>
              {recentReviews.length === 0 ? (
                <p className={styles.trendHint}>아직 리뷰가 없습니다.</p>
              ) : (
                recentReviews.map((r, i) => (
                  <div key={r.reviewId} className={i === 0 ? styles.glassCard : styles.reviewCardMuted}>
                    <div className={styles.reviewCardTop}>
                      <span className={styles.reviewUser}>손님 #{r.memberProfileId}</span>
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
