import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OwnerHeader } from '../../components/OwnerHeader'
import { Icon } from '../../components/Icon'
import SimpleAlertModal from '../../components/SimpleAlertModal/SimpleAlertModal'
import { ApiError } from '../../api/authClient'
import { patchOwnerStore } from '../../api/owner/store'
import { useAuth } from '../../context/AuthProvider'
import { useOwnerStoreDetail } from '../../hooks/useOwnerStoreDetail'
import { openDaumPostcode } from '../../lib/daumPostcode'
import { getActiveOwnerStoreProfile, saveOwnerStoreProfile } from '../../lib/ownerSession'
import {
  getStoreCategoryLabel,
  isValidStoreCategoryId,
  persistStoreCategorySelection,
  STORE_CATEGORIES,
  type StoreCategoryId,
} from '../../lib/storeCategories'
import styles from './StoreSettingsPage.module.css'

function formatBizNumber(raw: string): string {
  const d = raw.replace(/\D/g, '')
  if (d.length !== 10) return raw
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
}

export function StoreSettingsPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { store, storeId, mockMode, loading } = useOwnerStoreDetail()
  const ownerProfile = getActiveOwnerStoreProfile()

  const initialCategory: StoreCategoryId =
    store?.categoryId != null && isValidStoreCategoryId(store.categoryId)
      ? (store.categoryId as StoreCategoryId)
      : 1

  const [categoryId, setCategoryId] = useState<StoreCategoryId>(initialCategory)
  const [address, setAddress] = useState(ownerProfile?.storeAddress || store?.address || '')
  const [saving, setSaving] = useState(false)
  const [savedOpen, setSavedOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (store?.categoryId != null && isValidStoreCategoryId(store.categoryId)) {
      setCategoryId(store.categoryId as StoreCategoryId)
    }
    const nextAddress = ownerProfile?.storeAddress || store?.address || ''
    if (nextAddress) setAddress(nextAddress)
  }, [store?.categoryId, store?.address, ownerProfile?.storeAddress])

  const categoryLabel = getStoreCategoryLabel(categoryId)
  const displayName = ownerProfile?.storeName || store?.name
  const displayPhone = ownerProfile?.storePhone || store?.phoneNumber

  const saveStoreMeta = async (nextCategoryId: StoreCategoryId, nextAddress: string) => {
    const trimmed = nextAddress.trim()
    if (!trimmed) {
      setError('매장 주소를 입력해 주세요.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      if (!mockMode) {
        await patchOwnerStore({ address: trimmed, categoryId: nextCategoryId })
      }
      setCategoryId(nextCategoryId)
      setAddress(trimmed)
      persistStoreCategorySelection(storeId, nextCategoryId)
      if (ownerProfile?.email) {
        saveOwnerStoreProfile({
          email: ownerProfile.email,
          businessNumber: ownerProfile.businessNumber,
          storeAddress: trimmed,
          storePhone: ownerProfile.storePhone,
          storeName: ownerProfile.storeName,
          storeId,
        })
      }
      setSavedOpen(true)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const selectCategory = (id: StoreCategoryId) => {
    void saveStoreMeta(id, address)
  }

  const handleAddressSearch = async () => {
    setError(null)
    try {
      const result = await openDaumPostcode()
      const next = [result.zonecode ? `(${result.zonecode})` : '', result.address].filter(Boolean).join(' ')
      setAddress(next)
      await saveStoreMeta(categoryId, next)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '주소 검색에 실패했습니다.'
      if (!msg.includes('취소')) setError(msg)
    }
  }

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
                <dd>{loading ? '…' : (displayName ?? '—')}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt>사업자번호</dt>
                <dd>{ownerProfile?.businessNumber ? formatBizNumber(ownerProfile.businessNumber) : '—'}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt>주소</dt>
                <dd>{address || '—'}</dd>
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

            <div className={styles.addressEdit}>
              <button type="button" className={styles.addressBtn} disabled={saving} onClick={() => void handleAddressSearch()}>
                <Icon name="search" />
                주소 변경
              </button>
              <p className={styles.hint}>
                주소·카테고리만 서버에 전송합니다. 좌표는 백엔드(TMAP)가 변환합니다.
              </p>
            </div>
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
                    disabled={saving}
                    className={[styles.chip, selected ? styles.chipSelected : ''].filter(Boolean).join(' ')}
                    onClick={() => selectCategory(id)}
                  >
                    {label}
                    {selected ? <Icon name="check" className={styles.chipCheck} /> : null}
                  </button>
                )
              })}
            </div>

            {error ? <p className={styles.errorHint}>{error}</p> : null}
            <p className={styles.hint}>
              {mockMode
                ? '예시 모드: 선택값은 이 브라우저에 저장됩니다.'
                : '카테고리를 고르면 현재 주소와 함께 서버에 저장됩니다.'}
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
        message={`가게 정보가 저장되었습니다. (카테고리: ${categoryLabel})`}
        variant="info"
        onClose={() => setSavedOpen(false)}
      />
    </>
  )
}
