import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { OwnerHeader } from '../../components/OwnerHeader'
import { Icon } from '../../components/Icon'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { useOwnerStoreCategory } from '../../hooks/useOwnerStoreCategory'
import { useOwnerStoreDetail } from '../../hooks/useOwnerStoreDetail'
import { formatPrice } from '../../lib/format'
import styles from './MenuPage.module.css'

export function MenuPage() {
  const { store, storeId, loading, error, mockMode } = useOwnerStoreDetail()
  const { categoryLabel } = useOwnerStoreCategory(storeId, store?.categoryId)
  const [search, setSearch] = useState('')

  const menus = store?.menus ?? []
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return menus
    return menus.filter((m) => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q))
  }, [menus, search])

  const activeCount = menus.filter((m) => !m.isSoldOut).length
  const soldOutCount = menus.length - activeCount

  return (
    <>
      <OwnerHeader
        title="메뉴관리"
        subtitle={mockMode ? `${store?.name ?? ''} · 예시 데이터` : store?.name}
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
                    : mockMode
                      ? '예시 메뉴 데이터입니다. API 연동 시 실제 매장 메뉴가 표시됩니다.'
                      : '실시간으로 매장 메뉴와 품절 상태를 관리하세요.'}
              </p>
            </div>
            <Link to="/menu/new" className={styles.btnAdd}>
              <Icon name="add" />
              신규 메뉴 등록
            </Link>
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
            <EmptyState icon="error" title="메뉴를 불러오지 못했습니다" description={error} />
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
              {filtered.map((m) => (
                <div key={m.menuId} className={styles.card}>
                  <div className={styles.thumbWrap}>
                    <div className={styles.thumbPlaceholder} aria-hidden>
                      <Icon name="restaurant" />
                    </div>
                    <span className={styles.tag}>MENU</span>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.rowTop}>
                      <h3 className={styles.itemTitle}>{m.name}</h3>
                      <span className={styles.price}>{formatPrice(m.price)}</span>
                    </div>
                    <p className={styles.itemDesc}>{m.description || '설명 없음'}</p>
                  </div>
                  <div className={styles.footer}>
                    <div className={styles.toggleRow}>
                      <span className={styles.saleLabel}>판매 상태</span>
                      <span className={`${styles.track} ${!m.isSoldOut ? styles.trackOn : styles.trackOff}`}>
                        <span className={`${styles.knob} ${!m.isSoldOut ? styles.knobOn : styles.knobOff}`} />
                      </span>
                      <span className={!m.isSoldOut ? styles.saleOn : styles.saleOff}>
                        {!m.isSoldOut ? '판매중' : '품절'}
                      </span>
                    </div>
                    <button type="button" className={styles.btnEdit} disabled title="메뉴 수정 API 연동 예정">
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
          )}
        </div>
      </main>
    </>
  )
}
