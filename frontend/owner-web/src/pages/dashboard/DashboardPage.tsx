import { Link } from 'react-router-dom'
import { OwnerHeader } from '../../components/OwnerHeader'
import { Icon } from '../../components/Icon'
import { useOwnerSales } from '../../context/OwnerSalesProvider'
import { useOwnerStoreDetail } from '../../hooks/useOwnerStoreDetail'
import styles from './DashboardPage.module.css'

export function DashboardPage() {
  const {
    salesPaused,
    resumeSales,
    isScheduledPause,
    remainingMinutesLabel,
    formatResumeAtLabel,
  } = useOwnerSales()
  const { store, mockMode } = useOwnerStoreDetail()

  return (
    <>
      <OwnerHeader
        title="대시보드"
        subtitle={mockMode ? `${store?.name ?? ''} · 예시 데이터` : store?.name}
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
        ) : null}

        <section className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricTop}>
              <span className={styles.metricLabel}>오늘 매출액</span>
              <div className={`${styles.metricIconWrap} ${styles.metricIconWrapPink}`}>
                <Icon name="payments" />
              </div>
            </div>
            <div>
              <h2 className={styles.metricValue}>₩ 2,450,000</h2>
              <div className={styles.trendRow}>
                <span className={styles.trendUpPink}>
                  <Icon name="trending_up" />
                  12.5%
                </span>
                <span className={styles.trendHint}>전일 대비 증가</span>
              </div>
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
                142 <span className={styles.metricSub}>건</span>
              </h2>
              <div className={styles.trendRow}>
                <span className={styles.trendUpViolet}>
                  <Icon name="trending_up" />
                  8.2%
                </span>
                <span className={styles.trendHint}>전일 동시간 대비</span>
              </div>
            </div>
          </div>
          <div className={`${styles.metricCard} ${styles.metricCardAccent}`}>
            <div className={styles.metricTop}>
              <span className={styles.metricLabel}>실시간 배달</span>
              <div className={`${styles.metricIconWrap} ${styles.metricIconWrapPulse}`}>
                <Icon name="delivery_dining" />
              </div>
            </div>
            <div>
              <h2 className={styles.metricValue}>
                18 <span className={styles.metricSub}>진행중</span>
              </h2>
              <p className={styles.trendHint}>+5명의 라이더 매칭 대기</p>
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
                <button type="button" className={styles.tabActive}>
                  이번주
                </button>
                <button type="button" className={styles.tabIdle}>
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
                    d="M0,150 C100,140 150,180 250,120 C350,60 450,140 550,80 C650,20 750,100 850,40 L1000,60"
                    fill="none"
                    stroke="#FF4D8D"
                    strokeLinecap="round"
                    strokeWidth="4"
                  />
                  <path
                    d="M0,150 C100,140 150,180 250,120 C350,60 450,140 550,80 C650,20 750,100 850,40 L1000,60 V200 H0 Z"
                    fill="url(#line-grad)"
                  />
                </svg>
              </div>
              <div className={styles.dayLabels}>
                {['월', '화', '수', '목', '금', '토', '일'].map((d) => (
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
              {[
                { rank: '01', name: '불꽃 숙성 삼겹살', orders: 428, price: '₩ 18,500' },
                { rank: '02', name: '시그니처 비빔밥', orders: 312, price: '₩ 12,000' },
                { rank: '03', name: '명장 얼큰 라면', orders: 285, price: '₩ 9,500' },
              ].map((m) => (
                <div key={m.rank} className={styles.rankRow}>
                  <div className={styles.rankNum}>{m.rank}</div>
                  <div className={styles.rankThumb} />
                  <div className={styles.rankInfo}>
                    <h4 className={styles.rankName}>{m.name}</h4>
                    <p className={styles.rankMeta}>주간 주문 {m.orders}건</p>
                  </div>
                  <div className={styles.rankPrice}>{m.price}</div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.reviewsPanel}>
            <div className={styles.reviewsHead}>
              <h3 className={styles.reviewsTitleRow}>
                <Icon name="forum" style={{ color: 'var(--owner-secondary)' }} />
                최근 리뷰 요약
              </h3>
              <div className={styles.ratingPill}>
                <Icon name="star" filled style={{ fontSize: '0.875rem', color: 'var(--owner-primary)' }} />
                <span className={styles.ratingNum}>4.8</span>
              </div>
            </div>
            <div className={styles.reviewCards}>
              <div className={styles.glassCard}>
                <div className={styles.reviewCardTop}>
                  <span className={styles.reviewUser}>lucy_kim01</span>
                  <span className={styles.reviewTime}>10분 전</span>
                </div>
                <p className={styles.reviewBody}>배달도 빠르고 삼겹살이 정말 맛있어요! 추천합니다.</p>
              </div>
              <div className={styles.reviewCardMuted}>
                <div className={styles.reviewCardTop}>
                  <span className={styles.reviewUser}>gourmet_lee</span>
                  <span className={styles.reviewTime}>45분 전</span>
                </div>
                <p className={styles.reviewBody}>비빔밥 양이 정말 많아요. 재료도 신선했습니다.</p>
              </div>
            </div>
            <Link to="/reviews" className={styles.linkReviews}>
              전체 리뷰 보기
            </Link>
          </div>
        </section>
      </main>

      <button type="button" className={styles.fab} title="신규 주문 등록">
        <Icon name="add_box" className={styles.fabIcon} />
      </button>
    </>
  )
}
