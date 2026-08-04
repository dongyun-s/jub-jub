import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OwnerHeader } from '../../components/OwnerHeader'
import { Icon } from '../../components/Icon'
import SimpleAlertModal from '../../components/SimpleAlertModal/SimpleAlertModal'
import { useAuth } from '../../context/AuthProvider'
import { useOwnerStoreCategory } from '../../hooks/useOwnerStoreCategory'
import { useOwnerStoreDetail } from '../../hooks/useOwnerStoreDetail'
import { getActiveOwnerStoreProfile } from '../../lib/ownerSession'
import { STORE_CATEGORIES } from '../../lib/storeCategories'
import styles from './StoreSettingsPage.module.css'

function formatBizNumber(raw: string): string {
  const d = raw.replace(/\D/g, '')
  if (d.length !== 10) return raw
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
}

export function StoreSettingsPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { store, storeId, mockMode } = useOwnerStoreDetail()
  const ownerProfile = getActiveOwnerStoreProfile()
  const { categoryId, categoryLabel, setCategoryId } = useOwnerStoreCategory(
    storeId,
    store?.categoryId,
  )
  const [savedOpen, setSavedOpen] = useState(false)

  const selectCategory = (id: typeof categoryId) => {
    setCategoryId(id)
    setSavedOpen(true)
  }

  const displayName = ownerProfile?.storeName || store?.name
  const displayAddress = ownerProfile?.storeAddress || store?.address
  const displayPhone = ownerProfile?.storePhone || store?.phoneNumber

  return (
    <>
      <OwnerHeader
        title="매장 정보"
        subtitle={mockMode ? `${displayName ?? ''} · 예시 데이터` : displayName}
      />
      <main className={styles.main}>
        <div className={styles.inner}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Icon name="store" />
              기본 정보
            </h2>
            <dl className={styles.infoList}>
              <div className={styles.infoRow}>
                <dt>매장 PK</dt>
                <dd>{storeId}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt>매장명</dt>
                <dd>{displayName ?? '—'}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt>사업자번호</dt>
                <dd>{ownerProfile?.businessNumber ? formatBizNumber(ownerProfile.businessNumber) : '—'}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt>주소</dt>
                <dd>{displayAddress ?? '—'}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt>가게 전화</dt>
                <dd>{displayPhone ?? '—'}</dd>
              </div>
              {ownerProfile?.email ? (
                <div className={styles.infoRow}>
                  <dt>사장님 계정</dt>
                  <dd>{ownerProfile.email}</dd>
                </div>
              ) : null}
            </dl>
            <p className={styles.hint}>
              사장님 계정과 매장은 1:1입니다. 사업자·주소·전화는 가입 시 이 브라우저에 저장된 값입니다.
            </p>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2 className={styles.cardTitle}>
                  <Icon name="category" />
                  가게 카테고리
                </h2>
                <p className={styles.cardDesc}>
                  고객 앱에서 한식·양식 등으로 검색·필터됩니다. 현재{' '}
                  <strong className={styles.currentCat}>{categoryLabel}</strong>
                </p>
              </div>
            </div>

            <div className={styles.chipGrid} role="listbox" aria-label="가게 카테고리 선택">
              {STORE_CATEGORIES.map(({ id, label }) => {
                const selected = categoryId === id
                return (
                  <button
                    key={id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={[styles.chip, selected ? styles.chipSelected : ''].filter(Boolean).join(' ')}
                    onClick={() => selectCategory(id)}
                  >
                    {label}
                    {selected ? <Icon name="check" className={styles.chipCheck} /> : null}
                  </button>
                )
              })}
              <button
                type="button"
                role="option"
                aria-selected={categoryId == null}
                className={[styles.chip, styles.chipEtc, categoryId == null ? styles.chipSelected : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => selectCategory(null)}
              >
                기타
                {categoryId == null ? <Icon name="check" className={styles.chipCheck} /> : null}
              </button>
            </div>

            <p className={styles.hint}>
              {mockMode
                ? '예시 모드: 선택값은 이 브라우저에 저장됩니다. API 연동 시 매장 정보와 함께 서버에 반영됩니다.'
                : '카테고리 변경 API 연동 후 서버에 저장됩니다.'}
            </p>

            <div className={styles.logoutRow}>
              <button
                type="button"
                className={styles.logoutBtn}
                onClick={() => {
                  logout()
                  navigate('/auth/login', { replace: true })
                }}
              >
                <Icon name="logout" />
                로그아웃
              </button>
              <p className={styles.logoutHint}>토큰이 삭제되며 로그인 페이지로 이동합니다.</p>
            </div>
          </section>
        </div>
      </main>

      <SimpleAlertModal
        open={savedOpen}
        title="저장됨"
        message={`가게 카테고리가 「${categoryLabel}」(으)로 설정되었습니다.`}
        variant="info"
        onClose={() => setSavedOpen(false)}
      />
    </>
  )
}
