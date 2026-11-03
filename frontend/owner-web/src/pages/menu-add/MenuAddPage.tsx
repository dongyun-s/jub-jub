import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { OwnerHeader } from '../../components/OwnerHeader'
import { Icon } from '../../components/Icon'
import SimpleAlertModal from '../../components/SimpleAlertModal/SimpleAlertModal'
import { useOwnerStoreDetail } from '../../hooks/useOwnerStoreDetail'
import { useOwnerMenus } from '../../hooks/useOwnerMenus'
import { ApiError } from '../../api/authClient'
import { OWNER_MENU_CATEGORIES, type OwnerMenuCategory } from '../../api/owner/menu'
import { uploadImageFileViaPresigned } from '../../api/uploads'
import styles from './MenuAddPage.module.css'

export function MenuAddPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { store, mockMode: storeMock } = useOwnerStoreDetail()
  const { createMenu, mockMode } = useOwnerMenus()
  const isMock = mockMode || storeMock

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState<OwnerMenuCategory>('MAIN')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState<{
    title: string
    message: string
    variant?: 'error' | 'success' | 'info'
    goList?: boolean
  } | null>(null)

  const onPickImage = (file: File | null) => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(file ? URL.createObjectURL(file) : null)
  }

  const handleSave = async () => {
    const trimmedName = name.trim()
    const priceNum = Number(price)
    if (!trimmedName) {
      setAlert({ title: '입력 확인', message: '메뉴명을 입력해 주세요.', variant: 'error' })
      return
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setAlert({ title: '입력 확인', message: '가격을 올바르게 입력해 주세요.', variant: 'error' })
      return
    }

    setSaving(true)
    try {
      let imageUrl: string | null = null
      if (imageFile && !isMock) {
        imageUrl = await uploadImageFileViaPresigned('MENU', imageFile)
      } else if (imageFile && isMock) {
        imageUrl = imagePreview
      }

      const result = await createMenu({
        name: trimmedName,
        description: description.trim(),
        price: Math.floor(priceNum),
        category,
        imageUrl,
        isSpicy: false,
        isVegetarian: false,
        isBest: false,
      })
      setAlert({
        title: '등록 완료',
        message: result.message || '메뉴가 등록되었습니다.',
        variant: 'success',
        goList: true,
      })
    } catch (e: unknown) {
      setAlert({
        title: '등록 실패',
        message: e instanceof ApiError ? e.message : '메뉴를 등록하지 못했습니다.',
        variant: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <OwnerHeader
        title="메뉴 추가"
        subtitle={isMock ? `${store?.name ?? ''} · 예시 데이터` : store?.name}
      />
      <main className={styles.main}>
        <div className={styles.inner}>
          <div className={styles.intro}>
            <div className={styles.breadcrumb}>
              <Link to="/menu" style={{ color: 'inherit', textDecoration: 'none' }}>
                메뉴 관리
              </Link>
              <Icon name="chevron_right" style={{ fontSize: '0.75rem', opacity: 0.6 }} />
              <span className={styles.breadcrumbAccent}>신규 등록</span>
            </div>
            <h1 className={styles.pageTitle}>메뉴 추가</h1>
            <p className={styles.pageDesc}>
              Presigned URL로 이미지를 올린 뒤, 메뉴 등록 API에 imageUrl을 함께 보냅니다.
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
                    <label className={styles.label} htmlFor="menu-name">
                      메뉴명
                    </label>
                    <input
                      id="menu-name"
                      type="text"
                      placeholder="예: 치즈버거"
                      className={styles.input}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={saving}
                      maxLength={100}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="menu-desc">
                      설명
                    </label>
                    <textarea
                      id="menu-desc"
                      rows={4}
                      placeholder="재료, 조리법, 맛의 특징을 적어주세요."
                      className={styles.textarea}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  <div className={styles.row2}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="menu-price">
                        가격 (원)
                      </label>
                      <input
                        id="menu-price"
                        type="number"
                        placeholder="0"
                        className={styles.input}
                        min={0}
                        step={100}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        disabled={saving}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="menu-category">
                        카테고리
                      </label>
                      <select
                        id="menu-category"
                        className={styles.select}
                        value={category}
                        onChange={(e) => setCategory(e.target.value as OwnerMenuCategory)}
                        disabled={saving}
                      >
                        {OWNER_MENU_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label} ({c.value})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className={styles.colSide}>
              <section className={styles.card}>
                <h2 className={styles.cardTitlePlain}>메뉴 이미지</h2>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  hidden
                  onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                />
                {imagePreview ? (
                  <div className={styles.previewWrap}>
                    <img src={imagePreview} alt="메뉴 미리보기" className={styles.previewImg} />
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      disabled={saving}
                      onClick={() => {
                        onPickImage(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                    >
                      이미지 제거
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.upload}
                    disabled={saving}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Icon name="add_a_photo" className={styles.uploadIcon} />
                    <p className={styles.uploadText}>클릭하여 업로드</p>
                    <p className={styles.uploadHint}>JPEG/PNG/WebP/GIF · 최대 10MB</p>
                  </button>
                )}
              </section>
              <section className={styles.card}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => void handleSave()}
                  disabled={saving}
                >
                  <Icon name="save" />
                  {saving ? '저장 중…' : '저장'}
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

      <SimpleAlertModal
        open={alert != null}
        title={alert?.title}
        message={alert?.message ?? ''}
        variant={alert?.variant ?? 'info'}
        onClose={() => {
          const go = alert?.goList
          setAlert(null)
          if (go) navigate('/menu')
        }}
      />
    </>
  )
}
