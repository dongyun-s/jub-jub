/**
 * CartPage.tsx
 * 장바구니 페이지 (탭: 장바구니)
 * - 상품 목록, 수량 변경, 쿠폰 적용, 결제(포트원 연동), 하단 네비
 */

import { useState } from 'react'
import Layout from '../../components/Layout'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import { FEATURED_RESTAURANTS } from '../../constants'
import styles from './CartPage.module.css'

/** 포트원(아임포트) 결제 SDK 전역 타입 */
declare global {
  interface Window {
    IMP?: {
      init: (merchantId: string) => void
      request_pay: (
        params: {
          pg: string
          pay_method: string
          merchant_uid: string
          name: string
          amount: number
          buyer_email?: string
          buyer_name?: string
          buyer_tel?: string
        },
        callback: (response: {
          success: boolean
          imp_uid?: string
          merchant_uid?: string
          error_msg?: string
        }) => void
      ) => void
    }
  }
}

interface AppliedCoupon {
  id: number
  name: string
  discount: number
}

interface CartItem {
  id: number
  name: string
  options: string
  price: number
  quantity: number
  image?: string
}

interface CartPageProps {
  onBack: () => void
  onCheckout?: () => void
  onCouponClick?: () => void
  appliedCoupon?: AppliedCoupon | null
  onRemoveCoupon?: () => void
  onGoHome?: () => void
  onOrdersClick?: () => void
  onMapClick?: () => void
  onMypageClick?: () => void
  onFavoritesClick?: () => void
  cartCount?: number
  cartItems?: CartItem[]
  onCartItemsChange?: (items: CartItem[]) => void
}

/** App에서 장바구니를 관리하지 않을 때 사용하는 기본 데이터 (홈 카드와 통일) */
const defaultCartItems: CartItem[] = [
  {
    id: FEATURED_RESTAURANTS[0].id,
    name: FEATURED_RESTAURANTS[0].title,
    options: '기본 선택 / 소스 추가',
    price: 100,
    quantity: 1,
    image: FEATURED_RESTAURANTS[0].image,
  },
]

function CartPage({ 
  onBack: _onBack, 
  onCheckout, 
  onCouponClick, 
  appliedCoupon, 
  onRemoveCoupon, 
  onGoHome, 
  onOrdersClick, 
  onMapClick, 
  onMypageClick, 
  onFavoritesClick,
  cartCount = 0,
  cartItems: externalCartItems,
  onCartItemsChange
}: CartPageProps) {
  const [internalCartItems, setInternalCartItems] = useState<CartItem[]>(defaultCartItems)

  /** App에서 cartItems/onCartItemsChange 전달 시 외부 상태 사용, 없으면 내부 상태 */
  const cartItems = externalCartItems ?? internalCartItems

  const applyCartItems = (updater: (prev: CartItem[]) => CartItem[]) => {
    if (onCartItemsChange) {
      onCartItemsChange(updater(cartItems))
    } else {
      setInternalCartItems(updater)
    }
  }

  const [isProcessing, setIsProcessing] = useState(false)

  const formatPrice = (price: number) => price.toLocaleString() + '원'

  // 포트원 결제 요청
  const handlePayment = () => {
    if (!window.IMP) {
      alert('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    // 포트원 가맹점 식별코드 (테스트용)
    window.IMP.init('imp19424728')

    setIsProcessing(true)

    const merchantUid = `order_${Date.now()}`
    const orderName = cartItems.map(item => item.name).join(', ')

    window.IMP.request_pay(
      {
        pg: 'html5_inicis.INIpayTest', // 테스트용 PG사
        pay_method: 'card',
        merchant_uid: merchantUid,
        name: orderName.length > 40 ? orderName.substring(0, 40) + '...' : orderName,
        amount: total,
        buyer_name: '홍길동',
        buyer_tel: '010-1234-5678',
        buyer_email: 'test@jubjub.com',
      },
      (response) => {
        setIsProcessing(false)

        if (response.success) {
          alert(`결제가 완료되었습니다!\n주문번호: ${response.merchant_uid}`)
          onCheckout?.()
        } else {
          alert(`결제에 실패했습니다.\n${response.error_msg}`)
        }
      }
    )
  }

  // 수량 변경
  const updateQuantity = (id: number, delta: number) => {
    applyCartItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    )
  }

  // 아이템 삭제
  const removeItem = (id: number) => {
    applyCartItems((items) => items.filter((item) => item.id !== id))
  }

  // 가격 계산
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = appliedCoupon?.discount || 0
  const total = subtotal - discount

  return (
    <Layout showBackground={false}>
      <div className={styles.root}>
        <Header title="장바구니" onFavoriteClick={onFavoritesClick} />

        {/* 스크롤 영역 */}
        <div className={styles.scrollArea}>
          {/* 픽업 매장 정보 */}
          <section className={styles.pickupSection}>
            <div className={styles.pickupCard}>
              <div className={styles.pickupIcon}>
                <span className="material-symbols-outlined text-primary text-2xl">storefront</span>
              </div>
              <div className={styles.pickupInfo}>
                <p className={styles.pickupLabel}>픽업 매장</p>
                <p className={styles.pickupName}>줍줍 강남점</p>
                <p className={styles.pickupAddress}>서울시 강남구 테헤란로 123</p>
              </div>
              <button className={styles.pickupChevron}>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </section>

          {/* 주문 내역 */}
          <section className={styles.orderSection}>
            <h2 className={styles.orderTitle}>주문 내역</h2>
            
            <div className={styles.orderList}>
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className={styles.orderItemCard}
                >
                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className={styles.orderItemRemoveBtn}
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>

                  {/* 이미지 */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className={styles.orderItemImage}
                  />

                  {/* 정보 */}
                  <div className={styles.orderItemInfo}>
                    <h3 className={styles.orderItemName}>{item.name}</h3>
                    <p className={styles.orderItemOptions}>{item.options}</p>
                    <div className={styles.orderItemBottomRow}>
                      <span className={styles.orderItemPrice}>{formatPrice(item.price)}</span>
                      
                      {/* 수량 조절 */}
                      <div className={styles.quantityControl}>
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className={styles.quantityButton}
                        >
                          <span className="material-symbols-outlined text-lg">remove</span>
                        </button>
                        <span className={styles.quantityValue}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className={styles.quantityButton}
                        >
                          <span className="material-symbols-outlined text-lg">add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {cartItems.length === 0 && (
                <div className={styles.emptyState}>
                  <span className={`material-symbols-outlined ${styles.emptyIcon}`}>shopping_cart</span>
                  <p className={styles.emptyText}>장바구니가 비어있습니다.</p>
                </div>
              )}
            </div>
          </section>

          {/* 쿠폰 적용 */}
          <section className={styles.couponSection}>
            {appliedCoupon ? (
              <div className={styles.couponAppliedCard}>
                <div className={styles.couponAppliedHeader}>
                  <div className={styles.couponChip}>
                    <span className="text-2xl">🎟️</span>
                    <div>
                      <p className={styles.couponTitle}>쿠폰 적용됨</p>
                      <p className={styles.couponSubtitle}>{appliedCoupon.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={styles.couponDiscount}>
                      -{appliedCoupon.discount.toLocaleString()}원
                    </span>
                    <button
                      onClick={onRemoveCoupon}
                      className={styles.couponRemoveBtn}
                    >
                      <span className="material-symbols-outlined text-slate-500 text-sm">close</span>
                    </button>
                  </div>
                </div>
                <button
                  onClick={onCouponClick}
                  className={styles.couponActionBtn}
                >
                  다른 쿠폰 선택
                </button>
              </div>
            ) : (
              <div className={styles.couponCard}>
                <div className={styles.couponChip}>
                  <span className="text-2xl">🎟️</span>
                  <div>
                    <p className="font-bold text-slate-800">쿠폰 적용</p>
                    <p className="text-sm text-slate-500">
                      사용 가능한 쿠폰이 <span className="text-primary font-bold">3장</span> 있습니다
                    </p>
                  </div>
                </div>
                <button
                  onClick={onCouponClick}
                  className={styles.couponPrimaryBtn}
                >
                  쿠폰 선택
                </button>
              </div>
            )}
          </section>

          {/* 결제 금액 */}
          <section className={styles.summarySection}>
            <h2 className={styles.summaryTitle}>결제 금액</h2>
            
            <div className={styles.summaryCard}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>주문 금액</span>
                <span className={styles.summaryValue}>{formatPrice(subtotal)}</span>
              </div>
              
              {appliedCoupon && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryDiscountLabel}>
                    쿠폰 할인 ({appliedCoupon.name})
                  </span>
                  <span className={styles.summaryDiscountValue}>
                    -{formatPrice(appliedCoupon.discount)}
                  </span>
                </div>
              )}
              
              <div className={styles.summaryTotalRow}>
                <span className={styles.summaryTotalLabel}>최종 결제 금액</span>
                <span className={styles.summaryTotalValue}>
                  {formatPrice(total)}
                </span>
              </div>
            </div>
          </section>

          {/* 예상 픽업 시간 */}
          <section className={styles.pickupInfoSection}>
            <div className={styles.pickupInfoRow}>
              <span className="material-symbols-outlined text-slate-400">schedule</span>
              <span>
                예상 픽업 시간:{' '}
                <span className={styles.pickupInfoHighlight}>약 15분 ~ 20분 후</span>
              </span>
            </div>
          </section>
        </div>

        {/* 결제 버튼 */}
        <div className={styles.payBar}>
          <button
            onClick={handlePayment}
            disabled={cartItems.length === 0 || isProcessing}
            className={`${styles.payButton} ${
              cartItems.length === 0 || isProcessing ? styles.payButtonDisabled : ''
            }`}
          >
            {isProcessing ? (
              <div className={styles.payButtonMain}>
                <span className="material-symbols-outlined animate-spin">sync</span>
                <span>결제 처리중...</span>
              </div>
            ) : (
              <>
                <div className={styles.payButtonMain}>
                  <span className="material-symbols-outlined">shopping_bag</span>
                  <span>{formatPrice(total)} 결제하기</span>
                </div>
                <span className={styles.payButtonSub}>
                  PICKUP ESTIMATED AT 12:45 PM
                </span>
              </>
            )}
          </button>
        </div>

        {/* 하단 네비게이션 */}
        <BottomNav 
          active="cart" 
          cartCount={cartCount}
          onNavigate={(page) => {
            if (page === 'home') onGoHome?.()
            if (page === 'orders') onOrdersClick?.()
            if (page === 'map') onMapClick?.()
            if (page === 'mypage') onMypageClick?.()
          }}
        />
      </div>
    </Layout>
  )
}

export default CartPage
