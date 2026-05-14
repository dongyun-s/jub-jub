import { Link } from 'react-router-dom'
import { OwnerHeader } from '../../components/OwnerHeader'
import { Icon } from '../../components/Icon'
import styles from './MenuPage.module.css'

const tabs = ['전체', '메인', '사이드', '음료'] as const

const items = [
  {
    title: '시그니처 불고기 비빔밥',
    price: '₩ 14,000',
    tag: 'MAIN',
    desc: '특제 소스로 마리네이드한 불고기와 신선한 7가지 제철 채소.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9TtbaH37IFYXgUsbciRTpEv9Xuy785WjmWQWss7SVvwF7QwhL-sJyCErCpBaDH_2uQJ7r4-RU9eCXk4z_ozDDdwlhLv7RVNylFxcKVbc_Dn5fp8A4eB4xWQKOGQAe8wWbJLPmjwnmn8_3xGoiCjyfXgNjIkiRpnsTxFOcRNBdv0vyy2S5UHnDEXZPF4uWgUXtTgqit13ihnJam6w6uzpp2ohKXN1x2HmNldDgcHUwOF1L7fhGp_uuObgp1_qjJHEgiKTBBJEhVLF3',
    onSale: true,
  },
  {
    title: '숙성 묵은지 김치찌개',
    price: '₩ 12,000',
    tag: 'MAIN',
    desc: '300일 숙성된 묵은지와 국내산 암돼지의 깊은 조화.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpkHE9UjwifAKXDLJSqHRjylRM5Vj8B-UrZM_EiiF3nOXFyeUnL-m_Wu5fK4pXgBzcHHIKtREr5QY_V8xqubjIhS4zcDrsxBtK6EougJYO3lEYoZAmEmD1RG7Ab4v_br6TupBcPJFgFKo6Oh7AyQZS2qiVp9zGMz_RZJTFa3El9dBwteMA_2OEQCDHzf_0dD60g63yKVgdbajvqELNQqzl5XgyIrurpjhM2yrWPkxRxBjiYEWE1xGrFiuOgXmMuiMZ5cy6hiTCOM5d',
    onSale: false,
  },
  {
    title: '갈릭 허니 가라아게',
    price: '₩ 9,500',
    tag: 'SIDE',
    desc: '바삭하게 튀겨낸 닭다리살에 달콤한 마늘 꿀 소스 코팅.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5xJQaJvCFEzvVqiFGKvjHOXQD-NrgeIBT4JNMEYwdZmJ-M2WMtX7lQpy-ya7pl7a4MczHlMMu_Ymf3yVVOBuuOxYMw336i7NtDc_eQDTy17UGzc34-NNOyR0vlMpOMZYr4Ag-tI16Pw8JSD3yWSSCRfZ7_NUfPrHhPVURnV-3XEleLTfovkWbQxbxc4i5Y1Z57dU89jVe_XGbraRHtVjAn8ExjmqUnLRDEgz2N72BQpKjUGWlXV0JDEm30J49rmvf_P_OtFJW2za5',
    onSale: true,
  },
  {
    title: '생딸기 리얼 에이드',
    price: '₩ 6,500',
    tag: 'DRINK',
    desc: '매일 아침 공수하는 신선한 딸기로 만든 수제 청 에이드.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-i9dGnjeIxH_u6nQp78KoYLPxWEXfAgp9nDVaUnEuZpzHTVyy1aXt7BGjQLweIW0296LpJzMNErME2ypviThRs6HEewgCUKJfwfXOrwROHdI_5Ctd8DFKM1IyFtB-p59Gf8WVvbjoyN8GUmUgnEibT-vcgeMm5CxmSSQikMckfNFF6wmEtQ0hte6XTCZ5alFaNHgJdBRUGxS1LxxKJoUhhHkR-Pcf5Wqzyoc0u7Mu2ZDxxvZkUgUVsgEK_IAonPcvIZoLC4g3ndiL',
    onSale: true,
  },
]

export function MenuPage() {
  return (
    <>
      <OwnerHeader title="메뉴관리" showSearch searchPlaceholder="메뉴 검색..." />
      <main className={styles.main}>
        <div className={styles.inner}>
          <div className={styles.headRow}>
            <div>
              <h2 className={styles.title}>메뉴 관리</h2>
              <p className={styles.desc}>실시간으로 매장 메뉴와 품절 상태를 관리하세요.</p>
            </div>
            <Link to="/menu/new" className={styles.btnAdd}>
              <Icon name="add" />
              신규 메뉴 등록
            </Link>
          </div>

          <div className={styles.tabs}>
            {tabs.map((t, i) => (
              <button key={t} type="button" className={i === 0 ? `${styles.tab} ${styles.tabActive}` : styles.tab}>
                {t}
              </button>
            ))}
          </div>

          <div className={styles.grid}>
            {items.map((it) => (
              <div key={it.title} className={styles.card}>
                <div className={styles.thumbWrap}>
                  <img src={it.img} alt="" className={styles.thumb} />
                  <span className={styles.tag}>{it.tag}</span>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.rowTop}>
                    <h3 className={styles.itemTitle}>{it.title}</h3>
                    <span className={styles.price}>{it.price}</span>
                  </div>
                  <p className={styles.itemDesc}>{it.desc}</p>
                </div>
                <div className={styles.footer}>
                  <div className={styles.toggleRow}>
                    <span className={styles.saleLabel}>판매 상태</span>
                    <span className={`${styles.track} ${it.onSale ? styles.trackOn : styles.trackOff}`}>
                      <span className={`${styles.knob} ${it.onSale ? styles.knobOn : styles.knobOff}`} />
                    </span>
                    <span className={it.onSale ? styles.saleOn : styles.saleOff}>{it.onSale ? '판매중' : '품절'}</span>
                  </div>
                  <button type="button" className={styles.btnEdit}>
                    <Icon name="edit" style={{ fontSize: '0.875rem' }} />
                    수정
                  </button>
                </div>
              </div>
            ))}
            <Link to="/menu/new" className={styles.addCard}>
              <div className={styles.addIconWrap}>
                <Icon name="add_circle" className={styles.addIcon} />
              </div>
              <div>
                <p className={styles.addTitle}>메뉴 추가</p>
                <p className={styles.addHint}>새로운 맛을 등록하세요</p>
              </div>
            </Link>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>TOTAL</span>
              <span className={styles.statVal}>42</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statLabel}>ACTIVE</span>
              <span className={`${styles.statVal} ${styles.statValAccent}`}>38</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statLabel}>품절</span>
              <span className={styles.statVal}>4</span>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
