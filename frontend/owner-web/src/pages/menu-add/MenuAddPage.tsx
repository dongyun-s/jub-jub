import { Link } from 'react-router-dom'
import { OwnerHeader } from '../../components/OwnerHeader'
import { Icon } from '../../components/Icon'
import styles from './MenuAddPage.module.css'

export function MenuAddPage() {
  return (
    <>
      <OwnerHeader title="메뉴 추가" subtitle="Menu Management" />
      <main className={styles.main}>
        <div className={styles.inner}>
          <div className={styles.intro}>
            <div className={styles.breadcrumb}>
              <span>메뉴 관리</span>
              <Icon name="chevron_right" style={{ fontSize: '0.75rem', opacity: 0.6 }} />
              <span className={styles.breadcrumbAccent}>신규 등록</span>
            </div>
            <h1 className={styles.pageTitle}>메뉴 추가</h1>
            <p className={styles.pageDesc}>
              고객에게 보여질 정보를 정확히 입력해 주세요. (디자인 데모 — 저장 API 미연동)
            </p>
          </div>

          <div className={styles.grid}>
            <div className={styles.colMain}>
              <section className={styles.card}>
                <h2 className={styles.cardTitle}>
                  <Icon name="info" />
                  기본 정보
                </h2>
                <div className={styles.fieldStack}>
                  <div className={styles.field}>
                    <label className={styles.label}>메뉴명</label>
                    <input type="text" placeholder="예: 시그니처 트러플 버거" className={styles.input} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>설명</label>
                    <textarea rows={4} placeholder="재료, 조리법, 맛의 특징을 적어주세요." className={styles.textarea} />
                  </div>
                  <div className={styles.row2}>
                    <div className={styles.field}>
                      <label className={styles.label}>가격 (원)</label>
                      <input type="number" placeholder="0" className={styles.input} />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>카테고리</label>
                      <select className={styles.select}>
                        <option>메인</option>
                        <option>사이드</option>
                        <option>음료</option>
                        <option>디저트</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              <section className={styles.card}>
                <h2 className={styles.cardTitlePlain}>태그</h2>
                <div className={styles.tags}>
                  {['매운맛', '비건', '베스트'].map((t) => (
                    <label key={t} className={styles.tagLabel}>
                      <input type="checkbox" className={styles.checkbox} />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            <div className={styles.colSide}>
              <section className={styles.card}>
                <h2 className={styles.cardTitlePlain}>메뉴 이미지</h2>
                <button type="button" className={styles.upload}>
                  <Icon name="add_a_photo" className={styles.uploadIcon} />
                  <p className={styles.uploadText}>클릭하여 업로드</p>
                  <p className={styles.uploadHint}>권장 1080×1080, 최대 5MB</p>
                </button>
              </section>
              <section className={styles.card}>
                <button type="button" className={styles.btnPrimary}>
                  <Icon name="save" />
                  저장
                </button>
                <Link to="/menu" className={styles.btnSecondary}>
                  <Icon name="close" />
                  취소
                </Link>
              </section>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
