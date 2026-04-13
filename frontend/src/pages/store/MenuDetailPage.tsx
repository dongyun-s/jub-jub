/**
 * MenuDetailPage.tsx
 * 메뉴 상세 — GET /api/v1/stores/{storeId} 로 메뉴·옵션 조회 후 장바구니 담기(POST /api/v1/carts)
 */

import { useState, useEffect, useMemo } from 'react'
import Layout from '../../components/Layout'
import SimpleAlertModal from '../../components/SimpleAlertModal/SimpleAlertModal'
import { fetchStoreDetail } from '../../api/store'
import type { MenuDto } from '../../api/store'
import { addCartItem } from '../../api/cart'
import { ApiError } from '../../api/authClient'
import { getAccessToken } from '../../lib/authStorage'
import styles from './MenuDetailPage.module.css'

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop'

interface MenuDetailPageProps {
  storeId: number
  menuId: number
  onBack: () => void
  /** 장바구니 API 반영 후 App에서 목록 갱신 */
  onAfterAddToCart?: () => void | Promise<void>
  /** 담기 후 이동할 때 (예: 장바구니 탭) */
  onGoToCart?: () => void
}

function menuHeroImage(m: MenuDto | null, menuIndex: number): string {
  if (!m) return HERO_FALLBACK
  const pool = [
    'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=600&fit=crop',
  ]
  return pool[menuIndex % pool.length]
}

function MenuDetailPage({
  storeId,
  menuId,
  onBack,
  onAfterAddToCart,
  onGoToCart,
}: MenuDetailPageProps) {
  const [menu, setMenu] = useState<MenuDto | null>(null)
  const [menuIndex, setMenuIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  const [quantity, setQuantity] = useState(1)
  /** 선택한 옵션 ID (필수 옵션은 초기에 자동 포함) */
  const [selectedOptionIds, setSelectedOptionIds] = useState<Set<number>>(() => new Set())

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setMenu(null)
    fetchStoreDetail(storeId)
      .then((detail) => {
        if (cancelled) return
        const idx = detail.menus.findIndex((m) => m.menuId === menuId)
        const found = idx >= 0 ? detail.menus[idx] : null
        setMenuIndex(idx >= 0 ? idx : 0)
        setMenu(found)
        if (found) {
          const initial = new Set<number>()
          for (const o of found.options) {
            if (o.isRequired) initial.add(o.optionId)
          }
          setSelectedOptionIds(initial)
        } else {
          setSelectedOptionIds(new Set())
        }
      })
      .catch(() => {
        if (!cancelled) setMenu(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [storeId, menuId])

  const heroUrl = useMemo(() => menuHeroImage(menu, menuIndex), [menu, menuIndex])

  const toggleOption = (optionId: number, isRequired: boolean) => {
    if (isRequired) return
    setSelectedOptionIds((prev) => {
      const next = new Set(prev)
      if (next.has(optionId)) next.delete(optionId)
      else next.add(optionId)
      return next
    })
  }

  const optionExtraPrice = useMemo(() => {
    if (!menu) return 0
    let sum = 0
    for (const o of menu.options) {
      if (selectedOptionIds.has(o.optionId)) sum += o.additionalPrice
    }
    return sum
  }, [menu, selectedOptionIds])

  const unitPrice = menu ? menu.price + optionExtraPrice : 0
  const lineTotal = unitPrice * quantity

  const formatPrice = (price: number) => price.toLocaleString() + '원'

  const handleAddToCart = async () => {
    if (!menu || menu.isSoldOut) return
    if (!getAccessToken()) {
      setAlertMessage('로그인 후 장바구니에 담을 수 있습니다.')
      return
    }
    const missingRequired =
      menu.options.some((o) => o.isRequired && !selectedOptionIds.has(o.optionId))
    if (missingRequired) {
      setAlertMessage('필수 옵션을 모두 선택해 주세요.')
      return
    }

    setAdding(true)
    try {
      await addCartItem({
        storeId,
        menuId: menu.menuId,
        quantity,
        requestMemo: '',
        optionIds: Array.from(selectedOptionIds),
      })
      await onAfterAddToCart?.()
      onGoToCart?.()
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : '장바구니에 담지 못했습니다.'
      setAlertMessage(msg)
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <Layout showBackground={false}>
        <div className={styles.root}>
          <header className={styles.header}>
            <button type="button" onClick={onBack} className={styles.backButton}>
              <span className={`material-symbols-outlined ${styles.backIcon}`}>close</span>
            </button>
          </header>
          <p className="px-4 py-8 text-center text-sm text-slate-500">메뉴 정보를 불러오는 중…</p>
        </div>
      </Layout>
    )
  }

  if (!menu) {
    return (
      <Layout showBackground={false}>
        <div className={styles.root}>
          <header className={styles.header}>
            <button type="button" onClick={onBack} className={styles.backButton}>
              <span className={`material-symbols-outlined ${styles.backIcon}`}>close</span>
            </button>
          </header>
          <p className="px-4 py-8 text-center text-sm text-slate-600">
            메뉴를 찾을 수 없습니다.
          </p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout showBackground={false}>
      <div className={styles.root}>
        <SimpleAlertModal
          open={alertMessage != null}
          message={alertMessage ?? ''}
          onClose={() => setAlertMessage(null)}
        />
        <header className={styles.header}>
          <button type="button" onClick={onBack} className={styles.backButton}>
            <span className={`material-symbols-outlined ${styles.backIcon}`}>close</span>
          </button>
        </header>

        <div className={styles.scrollArea}>
          <div className={styles.heroWrap}>
            <div
              className={styles.heroImage}
              style={{ backgroundImage: `url('${heroUrl}')` }}
            >
              <div className={styles.heroOverlay} />
            </div>
            <div className={styles.tagsWrap}>
              <span className={styles.tagBest}>PICK UP</span>
            </div>
          </div>

          <div className={styles.infoSection}>
            <h1 className={styles.menuName}>{menu.name}</h1>
            {menu.description ? (
              <p className={styles.menuDesc}>{menu.description}</p>
            ) : null}
            <div className={styles.infoRow}>
              <span className={styles.menuPrice}>{formatPrice(menu.price)}</span>
              {menu.rewardXp > 0 ? (
                <div className={styles.xpBadge}>
                  <span className={`material-symbols-outlined ${styles.xpIcon}`}>bolt</span>
                  <span className={styles.xpText}>+{menu.rewardXp} XP</span>
                </div>
              ) : null}
            </div>
            {menu.isSoldOut ? (
              <p className="mt-2 text-sm font-medium text-amber-700">현재 품절입니다.</p>
            ) : null}
          </div>

          {menu.options.length > 0 ? (
            <div className={styles.optionsSection}>
              <div className={styles.optionGroup}>
                <div className={styles.optionGroupHeader}>
                  <div className={styles.optionGroupTitleRow}>
                    <h3 className={styles.optionGroupTitle}>옵션</h3>
                  </div>
                </div>
                <div className={styles.optionList}>
                  {menu.options.map((option) => {
                    const isSelected = selectedOptionIds.has(option.optionId)
                    return (
                      <button
                        key={option.optionId}
                        type="button"
                        onClick={() => toggleOption(option.optionId, option.isRequired)}
                        disabled={option.isRequired}
                        className={`${styles.optionButton} ${
                          isSelected
                            ? styles.optionButtonSelected
                            : styles.optionButtonUnselected
                        } ${option.isRequired ? 'opacity-90' : ''}`}
                      >
                        <div className={styles.optionLeft}>
                          <div
                            className={`${styles.optionRadio} ${
                              isSelected ? styles.optionRadioSelected : styles.optionRadioUnselected
                            }`}
                          >
                            {isSelected && (
                              <span
                                className={`material-symbols-outlined ${styles.optionRadioIcon}`}
                              >
                                check
                              </span>
                            )}
                          </div>
                          <span
                            className={`${styles.optionName} ${
                              isSelected ? styles.optionNameSelected : styles.optionNameUnselected
                            }`}
                          >
                            {option.name}
                            {option.isRequired ? ' (필수)' : ''}
                          </span>
                        </div>
                        {option.additionalPrice > 0 ? (
                          <span
                            className={`${styles.optionPrice} ${
                              isSelected ? styles.optionPriceSelected : styles.optionPriceUnselected
                            }`}
                          >
                            +{formatPrice(option.additionalPrice)}
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : null}

          <div className={styles.quantitySection}>
            <div className={styles.quantityRow}>
              <span className={styles.quantityLabel}>수량</span>
              <div className={styles.quantityControls}>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className={styles.quantityMinus}
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <span className={styles.quantityValue}>{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className={styles.quantityPlus}
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.addToCartBar}>
          <button
            type="button"
            onClick={() => void handleAddToCart()}
            disabled={menu.isSoldOut || adding}
            className={styles.addToCartButton}
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            <span>
              {adding ? '담는 중…' : `${formatPrice(lineTotal)} 담기`}
            </span>
          </button>
        </div>
      </div>
    </Layout>
  )
}

export default MenuDetailPage
