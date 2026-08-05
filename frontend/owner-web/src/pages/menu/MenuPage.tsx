import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { OwnerHeader } from '../../components/OwnerHeader'
import { Icon } from '../../components/Icon'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import AppModal from '../../components/AppModal/AppModal'
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import SimpleAlertModal from '../../components/SimpleAlertModal/SimpleAlertModal'
import mc from '../../components/AppModal/modalContent.module.css'
import { useOwnerStoreCategory } from '../../hooks/useOwnerStoreCategory'
import { useOwnerStoreDetail } from '../../hooks/useOwnerStoreDetail'
import { useOwnerMenus } from '../../hooks/useOwnerMenus'
import type { OwnerMenuListItem, OwnerMenuCategory } from '../../api/owner/menu'
import { OWNER_MENU_CATEGORIES, ownerMenuCategoryLabel } from '../../api/owner/menu'
import { ApiError } from '../../api/authClient'
import { formatPrice } from '../../lib/format'
import { resolveDisplayImageUrl } from '../../lib/imageUrl'
import styles from './MenuPage.module.css'

export function MenuPage() {
  const { store, storeId, mockMode: storeMock } = useOwnerStoreDetail()
  const { categoryLabel } = useOwnerStoreCategory(storeId, store?.categoryId)
  const {
    menus,
    loading,
    error,
    mockMode,
    busyId,
    reload,
    updateMenu,
    removeMenu,
    toggleSoldOut,
  } = useOwnerMenus()

  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState<OwnerMenuListItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editCategory, setEditCategory] = useState<OwnerMenuCategory>('MAIN')
  const [editSpicy, setEditSpicy] = useState(false)
  const [editVegetarian, setEditVegetarian] = useState(false)
  const [editBest, setEditBest] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<OwnerMenuListItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [alert, setAlert] = useState<{ title: string; message: string; variant?: 'error' | 'success' | 'info' } | null>(
    null,
  )
  const editTitleId = useId()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return menus
    return menus.filter(
      (m) => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q),
    )
  }, [menus, search])

  const activeCount = menus.filter((m) => !m.soldOut).length
  const soldOutCount = menus.length - activeCount
  const isMock = mockMode || storeMock

  const openEdit = (m: OwnerMenuListItem) => {
    setEditTarget(m)
    setEditName(m.name)
    setEditDesc(m.description)
    setEditPrice(String(m.price))
    setEditCategory(m.category)
    setEditSpicy(m.isSpicy)
    setEditVegetarian(m.isVegetarian)
    setEditBest(m.isBest)
  }

  const closeEdit = () => {
    if (editSaving) return
    setEditTarget(null)
  }

  const handleSaveEdit = async () => {
    if (!editTarget) return
    const name = editName.trim()
    const price = Number(editPrice)
    if (!name) {
      setAlert({ title: '입력 확인', message: '메뉴명을 입력해 주세요.', variant: 'error' })
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      setAlert({ title: '입력 확인', message: '가격을 올바르게 입력해 주세요.', variant: 'error' })
      return
    }
    setEditSaving(true)
    try {
      const result = await updateMenu(editTarget.menuId, {
        name,
        description: editDesc.trim(),
        price: Math.floor(price),
        category: editCategory,
        imageUrl: editTarget.imageUrl,
        isSpicy: editSpicy,
        isVegetarian: editVegetarian,
        isBest: editBest,
      })
      setEditTarget(null)
      setAlert({
        title: '수정 완료',
        message: result.message || '메뉴가 수정되었습니다.',
        variant: 'success',
      })
    } catch (e: unknown) {
      setAlert({
        title: '수정 실패',
        message: e instanceof ApiError ? e.message : '메뉴를 수정하지 못했습니다.',
        variant: 'error',
      })
    } finally {
      setEditSaving(false)
    }
  }

  const handleToggleSoldOut = async (m: OwnerMenuListItem) => {
    try {
      await toggleSoldOut(m.menuId, !m.soldOut)
    } catch (e: unknown) {
      setAlert({
        title: '상태 변경 실패',
        message: e instanceof ApiError ? e.message : '품절 상태를 변경하지 못했습니다.',
        variant: 'error',
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const msg = await removeMenu(deleteTarget.menuId)
      setDeleteTarget(null)
      setAlert({ title: '삭제 완료', message: msg, variant: 'success' })
    } catch (e: unknown) {
      setAlert({
        title: '삭제 실패',
        message: e instanceof ApiError ? e.message : '메뉴를 삭제하지 못했습니다.',
        variant: 'error',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <OwnerHeader
        title="메뉴관리"
        subtitle={isMock ? `${store?.name ?? ''} · 예시 데이터` : store?.name}
      />
      <main className={styles.main}>
        <div className={styles.inner}>
          <div className={styles.headRow}>
            <div>
              <Link to="/store" className={styles.categoryBadge}>
                <Icon name="category" style={{ fontSize: '0.875rem' }} />
                가게 카테고리: {categoryLabel}
              </Link>
              <p className={styles.desc}>
                {loading
                  ? '메뉴를 불러오는 중…'
                  : error
                    ? error
                    : isMock
                      ? '예시 메뉴 데이터입니다. 등록·수정·품절은 로컬에서만 반영됩니다.'
                      : '실시간으로 매장 메뉴와 품절 상태를 관리하세요.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {!isMock ? (
                <button type="button" className={styles.btnEdit} onClick={() => void reload()} disabled={loading}>
                  <Icon name="refresh" style={{ fontSize: '0.875rem' }} />
                  새로고침
                </button>
              ) : null}
              <Link to="/menu/new" className={styles.btnAdd}>
                <Icon name="add" />
                신규 메뉴 등록
              </Link>
            </div>
          </div>

          {!loading && !error && menus.length > 0 ? (
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>전체 메뉴</span>
                <span className={styles.statVal}>{menus.length}</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statLabel}>판매중</span>
                <span className={`${styles.statVal} ${styles.statValAccent}`}>{activeCount}</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statLabel}>품절 메뉴</span>
                <span className={styles.statVal}>{soldOutCount}</span>
              </div>
            </div>
          ) : null}

          <div className={styles.searchRow}>
            <input
              type="search"
              className="owner-input-field"
              placeholder="메뉴명·설명 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <p className={styles.loadingHint}>불러오는 중…</p>
          ) : error ? (
            <EmptyState
              icon="error"
              title="메뉴를 불러오지 못했습니다"
              description={error}
              action={
                <button type="button" className={styles.btnAddInline} onClick={() => void reload()}>
                  다시 시도
                </button>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="restaurant_menu"
              title={menus.length === 0 ? '등록된 메뉴가 없습니다' : '검색 결과가 없습니다'}
              description={
                menus.length === 0
                  ? '신규 메뉴 등록으로 첫 메뉴를 추가해 보세요.'
                  : '다른 검색어를 입력해 주세요.'
              }
              action={
                menus.length === 0 ? (
                  <Link to="/menu/new" className={styles.btnAddInline}>
                    메뉴 등록하기
                  </Link>
                ) : null
              }
            />
          ) : (
            <div className={styles.grid}>
              {filtered.map((m) => {
                const busy = busyId === m.menuId
                const img = resolveDisplayImageUrl(m.imageUrl)
                return (
                  <div key={m.menuId} className={styles.card}>
                    <div className={styles.thumbWrap}>
                      {img ? (
                        <img src={img} alt="" className={styles.thumbImg} />
                      ) : (
                        <div className={styles.thumbPlaceholder} aria-hidden>
                          <Icon name="restaurant" />
                        </div>
                      )}
                      <span className={styles.tag}>{m.soldOut ? '품절' : ownerMenuCategoryLabel(m.category)}</span>
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.rowTop}>
                        <h3 className={styles.itemTitle}>{m.name}</h3>
                        <span className={styles.price}>{formatPrice(m.price)}</span>
                      </div>
                      <p className={styles.itemDesc}>{m.description || '설명 없음'}</p>
                      <div className={styles.chipRow}>
                        {m.isBest ? <span className={styles.chip}>베스트</span> : null}
                        {m.isSpicy ? <span className={styles.chip}>매운맛</span> : null}
                        {m.isVegetarian ? <span className={styles.chip}>비건</span> : null}
                      </div>
                    </div>
                    <div className={styles.footer}>
                      <button
                        type="button"
                        className={styles.toggleRow}
                        disabled={busy}
                        onClick={() => void handleToggleSoldOut(m)}
                        aria-pressed={!m.soldOut}
                        title={m.soldOut ? '판매 재개' : '품절 처리'}
                      >
                        <span className={styles.saleLabel}>판매 상태</span>
                        <span className={`${styles.track} ${!m.soldOut ? styles.trackOn : styles.trackOff}`}>
                          <span className={`${styles.knob} ${!m.soldOut ? styles.knobOn : styles.knobOff}`} />
                        </span>
                        <span className={!m.soldOut ? styles.saleOn : styles.saleOff}>
                          {!m.soldOut ? '판매중' : '품절'}
                        </span>
                      </button>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className={styles.btnEdit}
                          disabled={busy}
                          onClick={() => openEdit(m)}
                        >
                          <Icon name="edit" style={{ fontSize: '0.875rem' }} />
                          수정
                        </button>
                        <button
                          type="button"
                          className={styles.btnEdit}
                          disabled={busy}
                          onClick={() => setDeleteTarget(m)}
                          title="메뉴 삭제"
                        >
                          <Icon name="delete" style={{ fontSize: '0.875rem' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
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
          )}
        </div>
      </main>

      <AppModal open={!!editTarget} onClose={closeEdit} size="md" aria-labelledby={editTitleId}>
        <h2 id={editTitleId} className={mc.titleLeft}>
          메뉴 수정
        </h2>
        <p className={mc.messageLeft}>메뉴 정보·카테고리·태그를 수정합니다.</p>
        <div className={styles.editFields}>
          <label className={mc.label}>
            메뉴명
            <input
              className={mc.input}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={editSaving}
            />
          </label>
          <label className={mc.label}>
            설명
            <textarea
              className={styles.editTextarea}
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              disabled={editSaving}
            />
          </label>
          <label className={mc.label}>
            가격 (원)
            <input
              className={mc.input}
              type="number"
              min={0}
              step={100}
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              disabled={editSaving}
            />
          </label>
          <label className={mc.label}>
            카테고리
            <select
              className={mc.input}
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value as OwnerMenuCategory)}
              disabled={editSaving}
            >
              {OWNER_MENU_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label} ({c.value})
                </option>
              ))}
            </select>
          </label>
          <div className={styles.editTagRow}>
            <label className={styles.editTag}>
              <input
                type="checkbox"
                checked={editSpicy}
                onChange={(e) => setEditSpicy(e.target.checked)}
                disabled={editSaving}
              />
              매운맛
            </label>
            <label className={styles.editTag}>
              <input
                type="checkbox"
                checked={editVegetarian}
                onChange={(e) => setEditVegetarian(e.target.checked)}
                disabled={editSaving}
              />
              비건
            </label>
            <label className={styles.editTag}>
              <input
                type="checkbox"
                checked={editBest}
                onChange={(e) => setEditBest(e.target.checked)}
                disabled={editSaving}
              />
              베스트
            </label>
          </div>
        </div>
        <div className={mc.btnRow}>
          <button type="button" className={mc.btnCancel} onClick={closeEdit} disabled={editSaving}>
            취소
          </button>
          <button type="button" className={mc.btnPrimary} onClick={() => void handleSaveEdit()} disabled={editSaving}>
            {editSaving ? '저장 중…' : '저장'}
          </button>
        </div>
      </AppModal>

      <ConfirmModal
        open={!!deleteTarget}
        title="메뉴 삭제"
        message={
          deleteTarget
            ? `"${deleteTarget.name}" 메뉴를 삭제할까요? 목록에서 숨김 처리됩니다.`
            : ''
        }
        confirmLabel={deleting ? '삭제 중…' : '삭제'}
        confirmTone="danger"
        confirmDisabled={deleting}
        onCancel={() => !deleting && setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />

      <SimpleAlertModal
        open={alert != null}
        title={alert?.title}
        message={alert?.message ?? ''}
        variant={alert?.variant ?? 'info'}
        onClose={() => setAlert(null)}
      />
    </>
  )
}
