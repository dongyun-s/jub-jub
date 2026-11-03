import { useMemo, useState } from 'react'
import { OwnerHeader } from '../../components/OwnerHeader'
import { Icon } from '../../components/Icon'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { useOwnerPayments } from '../../hooks/useOwnerPayments'
import { useOwnerStoreDetail } from '../../hooks/useOwnerStoreDetail'
import { formatPrice } from '../../lib/format'
import {
  getMockPaymentSummary,
  paymentStatusLabel,
  type MockPaymentStatus,
} from '../../lib/mocks/ownerMockPayments'
import styles from './PaymentsPage.module.css'

type FilterKey = 'all' | MockPaymentStatus

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'pending_settlement', label: '정산 예정' },
  { key: 'settled', label: '정산 완료' },
  { key: 'completed', label: '결제 완료' },
  { key: 'refunded', label: '환불' },
]

export function PaymentsPage() {
  const { store, mockMode } = useOwnerStoreDetail()
  const { payments, account, mockMode: useMock } = useOwnerPayments()
  const [filter, setFilter] = useState<FilterKey>('all')

  const summary = useMemo(() => getMockPaymentSummary(payments), [payments])

  const filtered = useMemo(() => {
    if (filter === 'all') return payments
    return payments.filter((p) => p.status === filter)
  }, [payments, filter])

  return (
    <>
      <OwnerHeader
        title="결제내역"
        subtitle={mockMode ? `${store?.name ?? ''} · 예시 데이터` : store?.name}
      />
      <main className={styles.main}>
        <div className={styles.inner}>
          {!useMock ? (
            <EmptyState
              icon="cloud_off"
              title="결제 API 미연동"
              description="VITE_OWNER_USE_MOCK=true 로 예시 결제·정산 내역을 확인할 수 있습니다."
            />
          ) : (
            <>
              <div className={styles.metrics}>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>오늘 결제액</span>
                  <span className={`${styles.metricVal} ${styles.monoNum}`}>
                    {formatPrice(summary.todayGross)}
                  </span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>정산 예정</span>
                  <span className={`${styles.metricVal} ${styles.metricValAccent} ${styles.monoNum}`}>
                    {formatPrice(summary.pendingNet)}
                  </span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>최근 정산</span>
                  <span className={`${styles.metricVal} ${styles.monoNum}`}>
                    {formatPrice(summary.lastSettledNet)}
                  </span>
                  <span className={styles.metricSub}>{summary.lastSettledLabel}</span>
                </div>
              </div>

              {account ? (
                <section className={styles.accountCard} aria-label="정산 계좌">
                  <div className={styles.accountHead}>
                    <Icon name="account_balance" />
                    <h2 className={styles.accountTitle}>정산 계좌</h2>
                  </div>
                  <p className={styles.accountBank}>
                    {account.bankName} {account.accountNumberMasked}
                  </p>
                  <p className={styles.accountHolder}>{account.holderName}</p>
                  <p className={styles.accountSchedule}>
                    <Icon name="schedule" style={{ fontSize: '0.875rem', verticalAlign: 'middle' }} />{' '}
                    {account.nextPayoutLabel}
                  </p>
                </section>
              ) : null}

              <section className={styles.listSection}>
                <div className={styles.listHead}>
                  <h2 className={styles.listTitle}>
                    결제 목록
                    <span className={`${styles.listCount} ${styles.monoNum}`}>{filtered.length}</span>
                  </h2>
                  <div className={styles.filters} role="tablist" aria-label="결제 상태 필터">
                    {FILTERS.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={filter === key}
                        className={[styles.filterBtn, filter === key ? styles.filterBtnActive : '']
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => setFilter(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <p className={styles.emptyList}>해당 상태의 결제 내역이 없습니다.</p>
                ) : (
                  <ul className={styles.list}>
                    {filtered.map((p) => (
                      <li key={p.paymentId}>
                        <article
                          className={[
                            styles.row,
                            p.status === 'refunded' ? styles.rowRefunded : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <div className={styles.rowMain}>
                            <div className={styles.rowTop}>
                              <span className={`${styles.orderNo} ${styles.monoNum}`}>#{p.orderNo}</span>
                              <span
                                className={[
                                  styles.statusBadge,
                                  styles[`status_${p.status}`],
                                ].join(' ')}
                              >
                                {paymentStatusLabel(p.status)}
                              </span>
                            </div>
                            <p className={styles.summary}>{p.summary}</p>
                            <p className={styles.meta}>
                              {p.paidAtLabel} · {p.method}
                            </p>
                          </div>
                          <div className={styles.rowAmounts}>
                            <span className={`${styles.gross} ${styles.monoNum}`}>
                              {p.status === 'refunded' ? (
                                <span className={styles.refundedAmt}>환불</span>
                              ) : (
                                formatPrice(p.amount)
                              )}
                            </span>
                            {p.status !== 'refunded' ? (
                              <span className={`${styles.net} ${styles.monoNum}`}>
                                정산 {formatPrice(p.netAmount)}
                              </span>
                            ) : null}
                          </div>
                        </article>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <p className={styles.footnote}>
                예시 데이터입니다. 실제 수수료·정산 일정은 API 연동 후 표시됩니다.
              </p>
            </>
          )}
        </div>
      </main>
    </>
  )
}
