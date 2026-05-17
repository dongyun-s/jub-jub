import { useState } from 'react'
import { OwnerHeader } from '../../components/OwnerHeader'
import { Icon } from '../../components/Icon'
import styles from './OrdersPage.module.css'

type OrderRow = {
  id: string
  label: string
  summary: string
  amount: string
  time: string
  status: 'new' | 'progress'
}

const orders: OrderRow[] = [
  { id: '8824-01', label: '신규', summary: '수비드 스테이크 외 2건', amount: '42,500원', time: '방금 전', status: 'new' },
  { id: '8824-00', label: '진행 중', summary: '트러플 머쉬룸 리조또', amount: '28,000원', time: '5분 전', status: 'progress' },
  { id: '8823-99', label: '진행 중', summary: '시그니처 플래터', amount: '56,000원', time: '12분 전', status: 'progress' },
  { id: '8823-98', label: '진행 중', summary: '하우스 와인 2잔', amount: '32,000원', time: '18분 전', status: 'progress' },
]

export function OrdersPage() {
  const [selectedId, setSelectedId] = useState(orders[0]?.id ?? '')
  const selected = orders.find((o) => o.id === selectedId) ?? orders[0]
  const newCount = orders.filter((o) => o.status === 'new').length

  return (
    <>
      <OwnerHeader title="주문내역" subtitle="실시간 POS" />
      <main className={styles.main}>
        <section className={styles.listPane}>
          <div className={styles.listHead}>
            <h2 className={styles.listTitle}>
              실시간 주문 <span className={`${styles.badgeNew} ${styles.monoNum}`}>{newCount}</span>
            </h2>
          </div>
          <div className={styles.listScroll}>
            {orders.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setSelectedId(o.id)}
                className={[
                  styles.orderBtn,
                  o.status === 'new' ? styles.orderBtnNew : styles.orderBtnProg,
                  selectedId === o.id ? styles.orderBtnSelected : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className={styles.orderTop}>
                  <span className={`${styles.orderId} ${styles.monoNum}`}>#{o.id}</span>
                  <span
                    className={[styles.tag, o.status === 'new' ? styles.tagNew : styles.tagProg].join(' ')}
                  >
                    {o.label}
                  </span>
                </div>
                <p className={styles.summary}>{o.summary}</p>
                <div className={styles.orderFoot}>
                  <span className={styles.time}>{o.time}</span>
                  <span
                    className={`${styles.amount} ${styles.monoNum} ${o.status === 'new' ? styles.amountHighlight : ''}`}
                  >
                    {o.amount}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.detailPane}>
          {selected ? (
            <>
              <div className={styles.detailHead}>
                <div>
                  <div className={styles.titleRow}>
                    <h3 className={`${styles.orderNo} ${styles.monoNum}`}>#{selected.id}</h3>
                    {selected.status === 'new' ? (
                      <span className={styles.pillNew}>신규 주문</span>
                    ) : (
                      <span className={styles.pillCook}>조리 중</span>
                    )}
                  </div>
                  <p className={styles.metaRow}>
                    <Icon name="schedule" style={{ fontSize: '0.875rem' }} />
                    오후 02:31 주문 접수 (배달)
                  </p>
                </div>
                <div className={styles.actions}>
                  <button type="button" className={styles.btnSecondary}>
                    <Icon name="print" />
                    주문지 출력
                  </button>
                  <button type="button" className={styles.btnDanger}>
                    거절
                  </button>
                </div>
              </div>

              <div className={styles.bodyRow}>
                <div className={styles.linesCol}>
                  <h4 className={styles.sectionLabel}>주문 내역</h4>
                  <div>
                    <div className={styles.lineItem}>
                      <div className={styles.lineLeft}>
                        <div className={styles.idx}>1</div>
                        <div>
                          <p className={styles.lineName}>수비드 부채살 스테이크</p>
                          <p className={styles.lineOpt}>옵션: 미디엄 레어, 가니쉬 추가</p>
                        </div>
                      </div>
                      <span className={`${styles.linePrice} ${styles.monoNum}`}>34,000원</span>
                    </div>
                    <div className={styles.lineItem}>
                      <div className={styles.lineLeft}>
                        <div className={styles.idx}>2</div>
                        <div>
                          <p className={styles.lineName}>시저 샐러드</p>
                          <p className={styles.lineOpt}>옵션: 드레싱 따로</p>
                        </div>
                      </div>
                      <span className={`${styles.linePrice} ${styles.monoNum}`}>8,500원</span>
                    </div>
                  </div>
                  <div className={styles.noteBox}>
                    <div className={styles.noteHead}>
                      <Icon name="chat_bubble" style={{ color: 'var(--owner-primary-container)' }} />
                      <h5 className={styles.noteTitle}>고객 요청사항</h5>
                    </div>
                    <p className={styles.noteText}>
                      문 앞에 두고 벨 눌러주세요. 스테이크 소스 넉넉히 부탁드립니다!
                    </p>
                  </div>
                </div>

                <div className={styles.sideCol}>
                  <div className={styles.payCard}>
                    <h4 className={styles.payTitle}>결제 정보</h4>
                    <div className={styles.payRows}>
                      <div className={styles.payRow}>
                        <span className={styles.payLabel}>주문 금액</span>
                        <span className={styles.monoNum}>42,500원</span>
                      </div>
                      <div className={styles.payRow}>
                        <span className={styles.payLabel}>배달 팁</span>
                        <span className={styles.monoNum}>3,500원</span>
                      </div>
                      <div className={styles.payRow}>
                        <span className={styles.payLabel}>할인 금액</span>
                        <span className={`${styles.monoNum} ${styles.payDiscount}`}>-3,500원</span>
                      </div>
                    </div>
                    <div className={styles.payTotal}>
                      <div className={styles.totalRow}>
                        <span className={styles.totalLabel}>합계</span>
                        <span className={`${styles.totalAmt} ${styles.monoNum}`}>42,500원</span>
                      </div>
                      <p className={styles.payMethod}>결제 수단: 신용카드 (일시불)</p>
                    </div>
                  </div>
                  <div className={styles.btnStack}>
                    <button type="button" className={styles.btnAccept}>
                      주문 수락
                    </button>
                    <button type="button" className={styles.btnDisabled} disabled>
                      조리 완료
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </section>
      </main>

      <div className={styles.statusFab}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>POS 시스템 정상</span>
        </div>
        <div className={styles.divider} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon name="restaurant" style={{ fontSize: '0.875rem' }} />
          <span className={styles.statusOpenLabel}>영업 중</span>
        </div>
      </div>
    </>
  )
}
