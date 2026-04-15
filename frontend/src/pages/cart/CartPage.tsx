/**
 * CartPage.tsx
 * 장바구니 페이지 (탭: 장바구니)
 * - 상품 목록, 수량 변경, 쿠폰 적용, 결제(포트원 연동), 하단 네비
 */

import { useState } from 'react'
import Layout from '../../components/Layout'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import { FEATURED_RESTAURANTS } from '../../constants'
import {
  addCartItem,
  clearCart,
  deleteCartItem,
  type ServerCartLineUi,
} from '../../api/cart'
import { confirmPayment, createOrder, preparePayment } from '../../api/payment'
import { ApiError } from '../../api/authClient'
import styles from './CartPage.module.css'

interface AppliedCoupon {
  id: number
  name: string
  discount: number
}

type CartItem = ServerCartLineUi

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
  /** 로그인 후 서버 장바구니와 동기화 */
  useApiCart?: boolean
  cartStoreId?: number | null
  onRefreshCart?: () => Promise<void>
  /** GET /carts 의 storeName */
  pickupStoreName?: string | null
}

/** App에서 장바구니를 관리하지 않을 때 사용하는 기본 데이터 (홈 카드와 통일) */
const defaultCartItems: CartItem[] = [
  {
    id: FEATURED_RESTAURANTS[0].id,
    menuId: FEATURED_RESTAURANTS[0].id,
    name: FEATURED_RESTAURANTS[0].title,
    options: '기본 선택 / 소스 추가',
    price: 100,
    quantity: 1,
    image: FEATURED_RESTAURANTS[0].image,
    optionIds: [],
    requestMemo: '',
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
  onCartItemsChange,
  useApiCart = false,
  cartStoreId = null,
  onRefreshCart,
  pickupStoreName = null,
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
  const [cartSyncing, setCartSyncing] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)

  const formatPrice = (price: number) => price.toLocaleString() + '원'

  const handleClearCart = () => {
    if (cartItems.length === 0) return
    if (!useApiCart || !onRefreshCart) {
      applyCartItems(() => [])
      return
    }
    setClearConfirmOpen(true)
  }

  const confirmClearCart = () => {
    setClearConfirmOpen(false)
    if (!useApiCart || !onRefreshCart) return

    setCartSyncing(true)
    void (async () => {
      try {
        await clearCart()
        await onRefreshCart()
      } catch (e) {
        alert(
          e instanceof ApiError ? e.message : '장바구니를 비우지 못했습니다. 잠시 후 다시 시도해 주세요.',
        )
      } finally {
        setCartSyncing(false)
      }
    })()
  }

  // PortOne V2 결제 요청
  const handlePayment = () => {
    if (!useApiCart || !onRefreshCart) {
      alert('로그인 후 결제를 진행해 주세요.')
      return
    }
    if (cartStoreId == null) {
      alert('픽업 매장을 확인할 수 없습니다. 메뉴를 다시 담아주세요.')
      return
    }

    const storeId = (import.meta.env.VITE_PORTONE_STORE_ID as string | undefined)?.trim()
    const channelKey = (import.meta.env.VITE_PORTONE_CHANNEL_KEY as string | undefined)?.trim()
    if (!storeId || !channelKey) {
      alert('PortOne 설정값이 없습니다. frontend/.env에 VITE_PORTONE_STORE_ID / VITE_PORTONE_CHANNEL_KEY를 넣어주세요.')
      return
    }

    setIsProcessing(true)

    const orderName = cartItems.map((item) => item.name).join(', ')

    void (async () => {
      try {
        const PortOne = await import(
          /* @vite-ignore */ 'https://cdn.portone.io/v2/browser-sdk.esm.js'
        )

        // 1) 주문 생성 (서버가 장바구니 금액 검증)
        const order = await createOrder({
          storeId: cartStoreId,
          totalAmount: subtotal,
        })

        // (DEBUG/임시) 주문내역 화면 표시용 로컬 저장 — 서버 주문내역 API 연결 전까지 사용
        try {
          const key = '__jubjub_local_orders'
          const raw = window.localStorage.getItem(key)
          const prev = raw ? (JSON.parse(raw) as unknown[]) : []
          const storeImage =
            FEATURED_RESTAURANTS.find((r) => r.id === cartStoreId)?.image ??
            cartItems[0]?.image ??
            null
          const menuSummary =
            cartItems.length === 0
              ? '주문'
              : cartItems.length === 1
                ? cartItems[0].name
                : `${cartItems[0].name} 외 ${cartItems.length - 1}건`

          const next = [
            {
              orderId: order.orderId,
              storeId: cartStoreId,
              storeName: pickupStoreName?.trim() || `매장 #${cartStoreId}`,
              menuSummary,
              totalAmount: subtotal,
              finalAmount: subtotal,
              image: storeImage,
              createdAt: new Date().toISOString(),
              paymentStatus: 'CREATED',
            },
            ...prev,
          ].slice(0, 50)
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch {
          /* ignore */
        }

        // 2) 결제 준비 (merchantUid 발급/READY 레코드 생성)
        const prepared = await preparePayment({
          orderId: order.orderId,
          method: 'CARD',
        })

        // (DEBUG) 결제 추적 저장은 제거(환불 기능 삭제)

        // 3) 결제창 호출 (V2 browser-sdk)
        const paymentResult = await PortOne.requestPayment({
          storeId,
          channelKey,
          paymentId: prepared.paymentId, // = prepared.merchantUid
          orderName: orderName.length > 40 ? `${orderName.substring(0, 40)}...` : orderName,
          customer: {
            email: 'test@jubjub.com',
            fullName: '홍길동',
            phoneNumber: '01012345678',
          },
          totalAmount: prepared.requestedAmount,
          currency: 'CURRENCY_KRW',
          payMethod: 'CARD',
        })

        // (DEBUG) 결제 결과 추적: transactionId 누락 원인 파악용
        // eslint-disable-next-line no-console
        console.log('[PortOne] paymentResult', paymentResult)

        /**
         * 결제창이 닫혔거나 실패한 경우 transactionId 가 없을 수 있음.
         * - 실제 결제가 성공했는데도(백엔드/webhook 기준) 브라우저에서 결과 전달이 누락되는 케이스가 있어
         *   여기서 "취소"로 단정하지 않는다.
         */
        const txId = paymentResult?.transactionId ?? paymentResult?.txId ?? null
        if (!txId) {
          // PortOne이 실패 사유를 내려주는 경우
          if (paymentResult?.code || paymentResult?.message) {
            alert(
              `결제에 실패했습니다.\n${paymentResult.code ? `코드: ${paymentResult.code}\n` : ''}${
                paymentResult.message ? `메시지: ${paymentResult.message}` : ''
              }`,
            )
            setIsProcessing(false)
            return
          }

          alert('결제창이 닫혔습니다. 결제 완료 여부는 주문내역에서 확인해 주세요.')
          onCheckout?.()
          setIsProcessing(false)
          return
        }

        // 4) 결제 확정 (PortOne 서버 조회로 재검증)
        const confirmed = await confirmPayment({
          merchantUid: prepared.merchantUid,
          transactionId: txId,
        })

        // (DEBUG) 환불 기능 삭제로 결제 추적 저장 제거

        // (DEBUG/임시) 방금 주문을 PAID로 업데이트 (로컬 주문내역)
        try {
          const key = '__jubjub_local_orders'
          const raw = window.localStorage.getItem(key)
          const prev = raw ? (JSON.parse(raw) as any[]) : []
          const next = prev.map((o) =>
            o?.orderId === order.orderId
              ? {
                  ...o,
                  paymentStatus: confirmed.paymentStatus,
                  paidAt: confirmed.paidAt,
                  paymentRecordId: confirmed.paymentRecordId,
                  transactionId: confirmed.transactionId,
                }
              : o,
          )
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch {
          /* ignore */
        }

        // 5) 장바구니 비우기 + 화면 진행
        try {
          await clearCart()
        } catch {
          /* ignore */
        }
        await onRefreshCart()

        alert(`결제가 완료되었습니다!\n주문번호: ${prepared.merchantUid}`)
        onCheckout?.()
        setIsProcessing(false)
      } catch (e) {
        setIsProcessing(false)
        alert(
          e instanceof ApiError
            ? e.message
            : '결제를 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        )
      }
    })()
  }

  // 수량 변경
  const updateQuantity = (id: number, delta: number) => {
    const item = cartItems.find((i) => i.id === id)
    if (!item) return
    const newQty = item.quantity + delta
    if (newQty < 1) return

    if (
      useApiCart &&
      onRefreshCart &&
      cartStoreId != null &&
      item.menuId != null
    ) {
      setCartSyncing(true)
      void (async () => {
        try {
          await deleteCartItem(id)
          await addCartItem({
            storeId: cartStoreId,
            menuId: item.menuId!,
            quantity: newQty,
            requestMemo: item.requestMemo || '',
            optionIds: item.optionIds ?? [],
          })
          await onRefreshCart()
        } catch (e) {
          alert(
            e instanceof ApiError
              ? e.message
              : '수량을 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.',
          )
        } finally {
          setCartSyncing(false)
        }
      })()
      return
    }

    applyCartItems((items) =>
      items.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
      )
    )
  }

  // 아이템 삭제
  const removeItem = (id: number) => {
    if (useApiCart && onRefreshCart) {
      setCartSyncing(true)
      void (async () => {
        try {
          await deleteCartItem(id)
          await onRefreshCart()
        } catch (e) {
          alert(
            e instanceof ApiError
              ? e.message
              : '삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.',
          )
        } finally {
          setCartSyncing(false)
        }
      })()
      return
    }
    applyCartItems((items) => items.filter((item) => item.id !== id))
  }

  // 가격 계산
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = appliedCoupon?.discount || 0
  const total = subtotal - discount

  return (
    <Layout showBackground={false}>
      <div className={styles.root}>
        <ConfirmModal
          open={clearConfirmOpen}
          title="장바구니 비우기"
          message="장바구니를 모두 비울까요?"
          cancelLabel="취소"
          confirmLabel="비우기"
          onCancel={() => setClearConfirmOpen(false)}
          onConfirm={confirmClearCart}
        />
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
                <p className={styles.pickupName}>
                  {pickupStoreName?.trim() || '매장을 선택해 주세요'}
                </p>
                <p className={styles.pickupAddress}>
                  {pickupStoreName
                    ? '포장 픽업은 이 매장에서 진행돼요.'
                    : '메뉴를 담으면 픽업 매장이 표시됩니다.'}
                </p>
              </div>
              <button className={styles.pickupChevron}>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </section>

          {/* 주문 내역 */}
          <section className={styles.orderSection}>
            <div className="flex items-center justify-between">
              <h2 className={styles.orderTitle}>주문 내역</h2>
              <button
                type="button"
                onClick={handleClearCart}
                disabled={cartItems.length === 0 || cartSyncing}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                전체 비우기
              </button>
            </div>
            
            <div className={styles.orderList}>
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className={styles.orderItemCard}
                >
                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={cartSyncing}
                    className={styles.orderItemRemoveBtn}
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>

                  {/* 이미지 */}
                  <img
                    src={
                      item.image ??
                      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop'
                    }
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
                          disabled={cartSyncing}
                          className={styles.quantityButton}
                        >
                          <span className="material-symbols-outlined text-lg">remove</span>
                        </button>
                        <span className={styles.quantityValue}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={cartSyncing}
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
            disabled={cartItems.length === 0 || isProcessing || cartSyncing}
            className={`${styles.payButton} ${
              cartItems.length === 0 || isProcessing || cartSyncing
                ? styles.payButtonDisabled
                : ''
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
