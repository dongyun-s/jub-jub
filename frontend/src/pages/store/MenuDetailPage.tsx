/**
 * MenuDetailPage.tsx
 * 메뉴 상세 페이지 (매장 상세에서 메뉴 클릭 시)
 * - 이미지·설명·가격·XP, 옵션 선택(필수/선택), 수량·장바구니 담기
 */

import { useState } from 'react'
import Layout from '../../components/Layout'
import styles from './MenuDetailPage.module.css'

interface MenuDetailPageProps {
  onBack: () => void
  onAddToCart?: () => void
}

interface OptionGroup {
  id: string
  name: string
  required: boolean
  maxSelect?: number
  options: {
    id: string
    name: string
    price: number
  }[]
}

/** 단일 메뉴 정보 (데모) */
const menuData = {
  id: 1,
  name: '프리미엄 줍줍 보울',
  description: '신선한 아보카도와 수비드 연어가 어우러진 줍줍의 시그니처 메뉴입니다. 유기농 현미밥 위에 정성껏 올린 토핑들이 건강한 한 끼를 완성합니다.',
  price: 14900,
  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjgVhe4RpU1CvWptSpJUoVU6IWkiGA1oG3BmLNe5Fh1sqjYiPgkIXsrWt2H4SC5dcLQJ33jO4h7uzFoDzlUYa-JYGPjg2Y2v_QTMV3JO_zi-sgUddtwX3objPZO-BZlh1r7riAc1TBA-_wfa2OrkfucW-kowHakz8w_hY7kyQpNdG_iRxqxaoWSGyNOtHlh4UMMyAaivn4TQSa-9b8IBqAgKhCgY6EXsC2yjE9XfW7vCsoiet34uBobR72zX2MlHJFLMbdAUbkXguB',
  xp: 50,
  tags: ['best', 'loot'] as const,
}

/** 사이즈·밥·추가 옵션 등 (데모) */
const optionGroups: OptionGroup[] = [
  {
    id: 'size',
    name: '사이즈 선택',
    required: true,
    options: [
      { id: 'regular', name: '레귤러', price: 0 },
      { id: 'large', name: '라지 (+3,000원)', price: 3000 },
    ],
  },
  {
    id: 'rice',
    name: '밥 선택',
    required: true,
    options: [
      { id: 'brown', name: '현미밥', price: 0 },
      { id: 'white', name: '백미밥', price: 0 },
      { id: 'quinoa', name: '퀴노아 (+1,500원)', price: 1500 },
    ],
  },
  {
    id: 'topping',
    name: '추가 토핑',
    required: false,
    maxSelect: 3,
    options: [
      { id: 'avocado', name: '아보카도 추가 (+2,000원)', price: 2000 },
      { id: 'salmon', name: '연어 추가 (+3,500원)', price: 3500 },
      { id: 'egg', name: '계란 추가 (+1,000원)', price: 1000 },
      { id: 'cheese', name: '치즈 추가 (+1,500원)', price: 1500 },
    ],
  },
]

function MenuDetailPage({ onBack, onAddToCart }: MenuDetailPageProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({
    size: ['regular'],
    rice: ['brown'],
    topping: [],
  })

  // 옵션 선택 핸들러
  const handleOptionSelect = (groupId: string, optionId: string, maxSelect?: number) => {
    setSelectedOptions((prev) => {
      const current = prev[groupId] || []
      
      if (maxSelect === undefined || maxSelect === 1) {
        // 단일 선택
        return { ...prev, [groupId]: [optionId] }
      } else {
        // 다중 선택
        if (current.includes(optionId)) {
          return { ...prev, [groupId]: current.filter((id) => id !== optionId) }
        } else if (current.length < maxSelect) {
          return { ...prev, [groupId]: [...current, optionId] }
        }
        return prev
      }
    })
  }

  // 총 가격 계산
  const calculateTotalPrice = () => {
    let total = menuData.price

    optionGroups.forEach((group) => {
      const selected = selectedOptions[group.id] || []
      selected.forEach((optionId) => {
        const option = group.options.find((o) => o.id === optionId)
        if (option) {
          total += option.price
        }
      })
    })

    return total * quantity
  }

  const formatPrice = (price: number) => price.toLocaleString() + '원'

  return (
    <Layout showBackground={false}>
      <div className={styles.root}>
        <header className={styles.header}>
          <button type="button" onClick={onBack} className={styles.backButton}>
            <span className={`material-symbols-outlined ${styles.backIcon}`}>close</span>
          </button>
        </header>

        <div className={styles.scrollArea}>
          <div className={styles.heroWrap}>
            <div className={styles.heroImage} style={{ backgroundImage: `url('${menuData.image}')` }}>
              <div className={styles.heroOverlay} />
            </div>
            <div className={styles.tagsWrap}>
              {menuData.tags.includes('best') && <span className={styles.tagBest}>BEST</span>}
              {menuData.tags.includes('loot') && <span className={styles.tagLoot}>LOOT</span>}
            </div>
          </div>

          <div className={styles.infoSection}>
            <h1 className={styles.menuName}>{menuData.name}</h1>
            <p className={styles.menuDesc}>{menuData.description}</p>
            <div className={styles.infoRow}>
              <span className={styles.menuPrice}>{formatPrice(menuData.price)}</span>
              {menuData.xp && (
                <div className={styles.xpBadge}>
                  <span className={`material-symbols-outlined ${styles.xpIcon}`}>bolt</span>
                  <span className={styles.xpText}>+{menuData.xp} XP</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.optionsSection}>
            {optionGroups.map((group) => (
              <div key={group.id} className={styles.optionGroup}>
                <div className={styles.optionGroupHeader}>
                  <div className={styles.optionGroupTitleRow}>
                    <h3 className={styles.optionGroupTitle}>{group.name}</h3>
                    {group.required ? (
                      <span className={styles.optionRequired}>필수</span>
                    ) : (
                      <span className={styles.optionOptional}>
                        선택 {group.maxSelect ? `(최대 ${group.maxSelect}개)` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.optionList}>
                  {group.options.map((option) => {
                    const isSelected = (selectedOptions[group.id] || []).includes(option.id)
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleOptionSelect(group.id, option.id, group.maxSelect || 1)}
                        className={`${styles.optionButton} ${isSelected ? styles.optionButtonSelected : styles.optionButtonUnselected}`}
                      >
                        <div className={styles.optionLeft}>
                          <div className={`${styles.optionRadio} ${isSelected ? styles.optionRadioSelected : styles.optionRadioUnselected}`}>
                            {isSelected && <span className={`material-symbols-outlined ${styles.optionRadioIcon}`}>check</span>}
                          </div>
                          <span className={`${styles.optionName} ${isSelected ? styles.optionNameSelected : styles.optionNameUnselected}`}>
                            {option.name}
                          </span>
                        </div>
                        {option.price > 0 && (
                          <span className={`${styles.optionPrice} ${isSelected ? styles.optionPriceSelected : styles.optionPriceUnselected}`}>
                            +{formatPrice(option.price)}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

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
          <button type="button" onClick={onAddToCart} className={styles.addToCartButton}>
            <span className="material-symbols-outlined">shopping_cart</span>
            <span>{formatPrice(calculateTotalPrice())} 담기</span>
          </button>
        </div>
      </div>
    </Layout>
  )
}

export default MenuDetailPage
