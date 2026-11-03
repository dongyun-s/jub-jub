import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OwnerHeader } from '../../components/OwnerHeader'
import { Icon } from '../../components/Icon'
import SimpleAlertModal from '../../components/SimpleAlertModal/SimpleAlertModal'
import { ApiError } from '../../api/authClient'
import {
  patchOwnerStore,
  updateOwnerStoreImage,
  updateOwnerStoreInfo,
  updateOwnerStoreMinOrder,
  updateOwnerStoreOrigin,
} from '../../api/owner/store'
import { uploadImageFileViaPresigned } from '../../api/uploads'
import { resolveDisplayImageUrl } from '../../lib/imageUrl'
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
  const { store, setStore, storeId, mockMode, loading } = useOwnerStoreDetail()
  const ownerProfile = getActiveOwnerStoreProfile()

  const initialCategory: StoreCategoryId =
    store?.categoryId != null && isValidStoreCategoryId(store.categoryId)
      ? (store.categoryId as StoreCategoryId)
      : 1

  const [categoryId, setCategoryId] = useState<StoreCategoryId>(initialCategory)
  const [address, setAddress] = useState(ownerProfile?.storeAddress || store?.address || '')
  const [saving, setSaving] = useState(false)
  const [savedOpen, setSavedOpen] = useState(false)
  const [savedMessage, setSavedMessage] = useState('가게 정보가 저장되었습니다.')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [coverUrl, setCoverUrl] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [hours, setHours] = useState('')
  const [notice, setNotice] = useState('')
  const [extraSaving, setExtraSaving] = useState(false)
  const [minOrder, setMinOrder] = useState('0')
  const [originInfo, setOriginInfo] = useState('')
  const [policySaving, setPolicySaving] = useState(false)
  const [originSaving, setOriginSaving] = useState(false)

  useEffect(() => {
    if (store?.categoryId != null && isValidStoreCategoryId(store.categoryId)) {
      setCategoryId(store.categoryId as StoreCategoryId)
    }
    const nextAddress = ownerProfile?.storeAddress || store?.address || ''
    if (nextAddress) setAddress(nextAddress)
  }, [store?.categoryId, store?.address, ownerProfile?.storeAddress])

  useEffect(() => {
    if (!store) return
    setMinOrder(String(store.minOrderAmount ?? 0))
    setOriginInfo(store.originInfo ?? '')
  }, [store?.storeId, store?.minOrderAmount, store?.originInfo])

  useEffect(() => {
    if (!store) return
    setHours(store.operatingHours ?? '')
    setNotice(store.notice ?? '')
  }, [store?.storeId, store?.operatingHours, store?.notice])

  useEffect(() => {
    if (coverFile) return
    setCoverUrl(store?.imageUrl?.trim() || '')
  }, [store?.imageUrl, coverFile])

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
      setSavedMessage(`가게 정보가 저장되었습니다. (카테고리: ${categoryLabel})`)
      setSavedOpen(true)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const saveOrigin = async () => {
    const nextOrigin = originInfo.trim()
    if (nextOrigin.length > 5000) {
      setError('원산지는 5,000자까지 입력할 수 있습니다.')
      return
    }
    setOriginSaving(true)
    setError(null)
    try {
      let savedOrigin = nextOrigin
      if (!mockMode) {
        const saved = await updateOwnerStoreOrigin(nextOrigin)
        savedOrigin = saved.originInfo ?? ''
      }
      if (store) setStore({ ...store, originInfo: savedOrigin })
      setOriginInfo(savedOrigin)
      setSavedMessage(
        mockMode
          ? '예시 모드라 이 화면에만 반영했습니다.'
          : savedOrigin
            ? '원산지를 저장했습니다. 고객 앱 가게 상세의 매장정보에 표시됩니다.'
            : '원산지를 삭제했습니다.',
      )
      setSavedOpen(true)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setOriginSaving(false)
    }
  }

  const saveOrderPolicy = async () => {
    const amount = Number(String(minOrder).replace(/[^\d]/g, ''))
    if (!Number.isSafeInteger(amount) || amount < 0) {
      setError('최소 주문 금액은 0원 이상으로 입력해 주세요. 0원이면 제한이 없습니다.')
      return
    }

    setPolicySaving(true)
    setError(null)
    try {
      if (!mockMode) {
        await updateOwnerStoreMinOrder(amount)
      }
      if (store) setStore({ ...store, minOrderAmount: amount })
      setMinOrder(String(amount))
      setSavedMessage(
        mockMode
          ? '예시 모드라 이 화면에만 반영했습니다.'
          : amount > 0
            ? '최소 주문 금액을 저장했습니다. 고객 앱 가게 카드와 상세에 표시됩니다.'
            : '최소 주문 금액을 없앴습니다. 고객 앱에는 제한 없음으로 표시됩니다.',
      )
      setSavedOpen(true)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setPolicySaving(false)
    }
  }

  const selectCategory = (id: StoreCategoryId) => {
    void saveStoreMeta(id, address)
  }

  const onPickCover = (file: File | null) => {
    if (coverPreview?.startsWith('blob:')) URL.revokeObjectURL(coverPreview)
    setCoverFile(file)
    setCoverPreview(file ? URL.createObjectURL(file) : null)
  }

  const saveExtra = async () => {
    if (storeId == null) return
    const operatingHours = hours.trim()
    const noticeText = notice.trim()
    if (operatingHours.length > 2000) {
      setError('운영시간은 2,000자까지 입력할 수 있습니다.')
      return
    }
    if (noticeText.length > 5000) {
      setError('안내사항은 5,000자까지 입력할 수 있습니다.')
      return
    }

    setExtraSaving(true)
    setError(null)
    try {
      let registeredImageUrl = coverUrl
      let imageSaved = false
      if (coverFile) {
        if (mockMode) {
          registeredImageUrl = coverPreview || coverUrl
        } else {
          const fileUrl = await uploadImageFileViaPresigned('STORE', coverFile)
          const savedImage = await updateOwnerStoreImage(fileUrl)
          registeredImageUrl = savedImage.imageUrl?.trim() || fileUrl
          imageSaved = true
          if (store) setStore({ ...store, imageUrl: registeredImageUrl })
        }
      }

      if (mockMode) {
        if (store) setStore({ ...store, operatingHours, notice: noticeText, imageUrl: registeredImageUrl || null })
        setHours(operatingHours)
        setNotice(noticeText)
      } else {
        const saved = await updateOwnerStoreInfo({ operatingHours, notice: noticeText })
        const nextHours = saved.operatingHours ?? ''
        const nextNotice = saved.notice ?? ''
        setHours(nextHours)
        setNotice(nextNotice)
        if (store) {
          setStore({
            ...store,
            operatingHours: saved.operatingHours ?? null,
            notice: saved.notice ?? null,
            imageUrl: registeredImageUrl || store.imageUrl || null,
            cookingTimeMinutes: saved.cookingTimeMinutes ?? store.cookingTimeMinutes,
          })
        }
      }

      setCoverUrl(registeredImageUrl || '')
      setCoverFile(null)
      if (coverPreview?.startsWith('blob:')) URL.revokeObjectURL(coverPreview)
      setCoverPreview(null)
      setSavedMessage(
        mockMode
          ? '예시 모드라 이 화면에만 반영했습니다.'
          : imageSaved
            ? '대표 이미지, 운영시간, 안내사항을 매장에 저장했습니다. 고객 앱 가게 상세에 표시됩니다.'
            : '운영시간과 안내사항을 저장했습니다. 고객 앱 가게 상세의 매장정보에 표시됩니다.',
      )
      setSavedOpen(true)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setExtraSaving(false)
    }
  }

  const coverSrc = coverPreview || resolveDisplayImageUrl(coverUrl)

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

            <label className={styles.field}>
              원산지
              <textarea
                className={styles.textarea}
                rows={4}
                maxLength={5000}
                value={originInfo}
                disabled={originSaving || loading}
                placeholder={'쌀: 국내산\n소고기: 호주산'}
                onChange={(e) => setOriginInfo(e.target.value)}
              />
            </label>
            <button
              type="button"
              className={styles.saveExtraBtn}
              disabled={originSaving || storeId == null}
              onClick={() => void saveOrigin()}
            >
              {originSaving ? '저장 중…' : '원산지 저장'}
            </button>
            <p className={styles.hint}>
              줄바꿈은 유지되고, 최대 5,000자입니다. 내용을 비우고 저장하면 삭제됩니다.
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
            <p className={styles.hint}>
              {mockMode
                ? '예시 모드: 선택값은 이 브라우저에 저장됩니다.'
                : '카테고리를 고르면 현재 주소와 함께 서버에 저장됩니다.'}
            </p>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Icon name="payments" />
              주문 조건
            </h2>
            <p className={styles.cardDesc}>
              고객 가게 카드와 가게 상세에 표시됩니다. 0원이면 최소 금액 제한이 없습니다.
            </p>
            <label className={styles.field}>
              최소 주문 금액 (원)
              <input
                className={styles.textInput}
                inputMode="numeric"
                value={minOrder}
                disabled={policySaving || loading}
                placeholder="0"
                onChange={(e) => setMinOrder(e.target.value.replace(/[^\d]/g, ''))}
              />
            </label>
            <button
              type="button"
              className={styles.saveExtraBtn}
              disabled={policySaving || storeId == null}
              onClick={() => void saveOrderPolicy()}
            >
              {policySaving ? '저장 중…' : '주문 조건 저장'}
            </button>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Icon name="image" />
              고객 화면 표시
            </h2>
            <p className={styles.cardDesc}>
              대표 이미지, 운영시간, 안내사항은 매장에 저장되어 고객 가게 상세에 보입니다. 운영시간을 비우면 해당 문구가 삭제됩니다.
            </p>

            <div className={styles.coverBlock}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                onChange={(e) => onPickCover(e.target.files?.[0] ?? null)}
              />
              {coverSrc ? (
                <img
                  src={coverSrc}
                  alt="매장 대표 이미지"
                  className={styles.coverPreview}
                  onError={(e) => {
                    if (e.currentTarget.src.endsWith('/logo.png')) return
                    e.currentTarget.src = '/logo.png'
                  }}
                />
              ) : (
                <div className={styles.coverEmpty}>대표 이미지 없음</div>
              )}
              <div className={styles.coverActions}>
                <button
                  type="button"
                  className={styles.addressBtn}
                  disabled={extraSaving}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Icon name="add_a_photo" />
                  이미지 선택
                </button>
                {coverFile ? (
                  <button
                    type="button"
                    className={styles.addressBtn}
                    disabled={extraSaving}
                    onClick={() => {
                      onPickCover(null)
                      setCoverUrl(store?.imageUrl?.trim() || '')
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                  >
                    선택 취소
                  </button>
                ) : null}
              </div>
            </div>

            <label className={styles.field}>
              운영시간
              <textarea
                className={styles.textarea}
                rows={4}
                maxLength={2000}
                value={hours}
                disabled={extraSaving}
                placeholder={'평일 09:00~21:00\n토요일 10:00~18:00\n일요일 휴무'}
                onChange={(e) => setHours(e.target.value)}
              />
            </label>
            <label className={styles.field}>
              안내사항
              <textarea
                className={styles.textarea}
                rows={4}
                maxLength={5000}
                value={notice}
                disabled={extraSaving}
                placeholder="픽업 시 주문번호를 알려주세요."
                onChange={(e) => setNotice(e.target.value)}
              />
            </label>
            <button type="button" className={styles.saveExtraBtn} disabled={extraSaving || storeId == null} onClick={() => void saveExtra()}>
              {extraSaving ? '저장 중…' : '표시 정보 저장'}
            </button>

            {error ? <p className={styles.errorHint}>{error}</p> : null}
            <p className={styles.hint}>
              메뉴 사진은 메뉴 등록 때 올린 이미지가 고객 메뉴에 쓰입니다. 서버가 imageUrl을 내려줘야 실제 사진이 보입니다.
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
        message={savedMessage}
        variant="info"
        onClose={() => setSavedOpen(false)}
      />
    </>
  )
}
