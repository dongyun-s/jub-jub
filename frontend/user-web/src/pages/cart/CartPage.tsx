/**
 * CartPage.tsx
 * 장바구니 페이지 (탭: 장바구니)
 * - 상품 목록, 수량 변경, 쿠폰 적용, 결제(포트원 연동), 하단 네비
 */

import { useEffect, useRef, useState } from 'react'
import Layout from '../../components/Layout'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import SimpleAlertModal, { type SimpleAlertVariant } from '../../components/SimpleAlertModal/SimpleAlertModal'
import { FEATURED_RESTAURANTS } from '../../constants'
import {
  addCartItem,
  clearCart,
  deleteCartItem,
  type ServerCartLineUi,
} from '../../api/cart'
import { confirmPayment, createOrder, preparePayment } from '../../api/payment'
import { ApiError } from '../../api/authClient'
import { calculateRewardDiscount, type RewardCalculateResponse } from '../../api/rewards'
import { getAccessToken, setCachedMemberProfileId } from '../../lib/authStorage'
import { resolveUserCoords } from '../../lib/geolocation'
import { ECO_DISCOUNT_AMOUNT, estimateFinalPaymentAmount } from '../../lib/orderPricing'
import styles from './CartPage.module.css'

interface AppliedCoupon {
  id: number
  name: string
  discount: number
}

type CartItem = ServerCartLineUi

type CartAlertState = {
  title?: string
  message: string
  variant?: SimpleAlertVariant
  confirmLabel?: string
  onAfterClose?: () => void
}

interface CartPageProps {
  onBack: () => void
  /** 결제 성공 시 주문 현황으로 이동 */
  onCheckout?: () => void
  onCouponClick?: () => void
  appliedCoupon?: AppliedCoupon | null
  onRemoveCoupon?: () => void
  onGoHome?: () => void
  onOrdersClick?: () => void
  onMapClick?: () => void
  onMypageClick?: () => void
  onFavoritesClick?: () => void
  onNotificationsClick?: () => void
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
    name: '테스트 메뉴 (100원)',
    options: '기본',
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
  onNotificationsClick,
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
  const [cartAlert, setCartAlert] = useState<CartAlertState | null>(null)

  const showCartAlert = (alert: CartAlertState) => setCartAlert(alert)
  const closeCartAlert = () => {
    setCartAlert((current) => {
      const afterClose = current?.onAfterClose
      // setState 업데이트 함수 안에서 App(setCurrentPage 등)을 바로 호출하면
      // "Cannot update App while rendering CartPage" 경고가 난다.
      if (afterClose) queueMicrotask(afterClose)
      return null
    })
  }
  /** 고객 웹: 다회용기 포장 선택 — 실제 할인은 POST /orders 시 서버에서 반영 */
  const [useMultiUseContainer, setUseMultiUseContainer] = useState(false)
  /** 로그인 시 POST /rewards/calculate 미리보기 (주문 생성 금액은 장바구니 합계와 일치해야 함) */
  const [pricingPreview, setPricingPreview] = useState<RewardCalculateResponse | null>(null)
  const pricingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        showCartAlert({
          title: '장바구니',
          message:
            e instanceof ApiError ? e.message : '장바구니를 비우지 못했습니다. 잠시 후 다시 시도해 주세요.',
          variant: 'error',
        })
      } finally {
        setCartSyncing(false)
      }
    })()
  }

  // PortOne V2 결제 요청
  const handlePayment = () => {
    if (!useApiCart || !onRefreshCart) {
      showCartAlert({
        title: '로그인 필요',
        message: '로그인 후 결제를 진행해 주세요.',
        variant: 'info',
      })
      return
    }
    if (cartStoreId == null) {
      showCartAlert({
        title: '매장 정보 없음',
        message: '픽업 매장을 확인할 수 없습니다. 메뉴를 다시 담아주세요.',
        variant: 'info',
      })
      return
    }

    const storeId = (import.meta.env.VITE_PORTONE_STORE_ID as string | undefined)?.trim()
    const channelKey = (import.meta.env.VITE_PORTONE_CHANNEL_KEY as string | undefined)?.trim()
    if (!storeId || !channelKey) {
      showCartAlert({
        title: '결제 설정',
        message:
          'PortOne 설정값이 없습니다. frontend/.env에 VITE_PORTONE_STORE_ID / VITE_PORTONE_CHANNEL_KEY를 넣어주세요.',
        variant: 'error',
      })
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
          memberCouponIds: appliedCoupon ? [appliedCoupon.id] : [],
          useMultiUseContainer,
        })
        if (order.memberProfileId != null) {
          setCachedMemberProfileId(order.memberProfileId)
        }

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
              totalAmount: order.originalAmount ?? subtotal,
              finalAmount: order.finalAmount,
              image: storeImage,
              createdAt: new Date().toISOString(),
              orderStatus: order.orderStatus,
              paymentStatus: 'READY',
              memberProfileId: order.memberProfileId,
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

        // 3) 결제창 — merchantUid·requestedAmount (명세)
        const paymentResult = await PortOne.requestPayment({
          storeId,
          channelKey,
          paymentId: prepared.merchantUid,
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
            const detail = [
              paymentResult.code ? `코드: ${paymentResult.code}` : '',
              paymentResult.message ? `메시지: ${paymentResult.message}` : '',
            ]
              .filter(Boolean)
              .join('\n')
            showCartAlert({
              title: '결제 실패',
              message: detail ? `결제에 실패했습니다.\n${detail}` : '결제에 실패했습니다.',
              variant: 'error',
            })
            setIsProcessing(false)
            return
          }

          showCartAlert({
            title: '결제창 닫힘',
            message: '결제창이 닫혔습니다. 결제 완료 여부는 주문내역에서 확인해 주세요.',
            variant: 'info',
          })
          setIsProcessing(false)
          return
        }

        // 4) 결제 확정 — 사용자 위치로 픽업 거리 저장 (백엔드 필수)
        const storeCoords = FEATURED_RESTAURANTS.find((r) => r.id === cartStoreId)
        const geoFallback =
          storeCoords?.lat != null && storeCoords?.lng != null
            ? { latitude: storeCoords.lat, longitude: storeCoords.lng }
            : null
        const userCoords = await resolveUserCoords(geoFallback)

        const confirmed = await confirmPayment({
          merchantUid: prepared.merchantUid,
          transactionId: txId,
          userLatitude: userCoords.latitude,
          userLongitude: userCoords.longitude,
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
                  orderStatus: 'PAID',
                  paymentStatus: confirmed.paymentStatus,
                  finalAmount: confirmed.paidAmount ?? order.finalAmount,
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

        showCartAlert({
          title: '결제 완료',
          message: `결제가 완료되었습니다.\n주문번호: ${prepared.merchantUid}`,
          variant: 'success',
          confirmLabel: onCheckout ? '주문 현황 보기' : '확인',
          onAfterClose: () => onCheckout?.(),
        })
        setIsProcessing(false)
      } catch (e) {
        setIsProcessing(false)
        if (e instanceof Error && e.message === 'GEO_DENIED') {
          showCartAlert({
            title: '위치 권한 필요',
            message: '결제 완료 처리를 위해 위치 권한을 허용해 주세요.',
            variant: 'info',
          })
          return
        }
        if (e instanceof Error && e.message === 'GEO_UNAVAILABLE') {
          showCartAlert({
            title: '위치 정보 없음',
            message: '이 기기에서는 위치 정보를 사용할 수 없어 결제를 완료할 수 없습니다.',
            variant: 'error',
          })
          return
        }
        showCartAlert({
          title: '결제 오류',
          message:
            e instanceof ApiError
              ? e.message
              : '결제를 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.',
          variant: 'error',
        })
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
          showCartAlert({
            title: '수량 변경',
            message:
              e instanceof ApiError
                ? e.message
                : '수량을 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.',
            variant: 'error',
          })
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
          showCartAlert({
            title: '삭제',
            message:
              e instanceof ApiError
                ? e.message
                : '삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.',
            variant: 'error',
          })
        } finally {
          setCartSyncing(false)
        }
      })()
      return
    }
    applyCartItems((items) => items.filter((item) => item.id !== id))
  }

  // 가격 계산 — 주문 생성 totalAmount는 할인 전 장바구니 합계(명세)
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = appliedCoupon?.discount || 0
  const total = subtotal - discount

  const estimatedFinal = estimateFinalPaymentAmount(
    pricingPreview,
    useMultiUseContainer,
    useApiCart ? subtotal : total,
  )

  /** UI·PortOne 전: 예상 결제액 / 주문 생성 시 totalAmount는 subtotal */
  const payAmount = useApiCart ? estimatedFinal : Math.max(0, total - (useMultiUseContainer ? ECO_DISCOUNT_AMOUNT : 0))

  useEffect(() => {
    if (!useApiCart || !getAccessToken() || subtotal <= 0) {
      setPricingPreview(null)
      return
    }
    if (pricingDebounceRef.current) clearTimeout(pricingDebounceRef.current)
    pricingDebounceRef.current = setTimeout(() => {
      void calculateRewardDiscount({
        originalOrderAmount: subtotal,
        memberCouponIds: appliedCoupon ? [appliedCoupon.id] : [],
      })
        .then(setPricingPreview)
        .catch(() => setPricingPreview(null))
    }, 400)
    return () => {
      if (pricingDebounceRef.current) clearTimeout(pricingDebounceRef.current)
    }
  }, [useApiCart, subtotal, appliedCoupon?.id, useMultiUseContainer])

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
        <SimpleAlertModal
          open={cartAlert != null}
          title={cartAlert?.title}
          message={cartAlert?.message ?? ''}
          variant={cartAlert?.variant ?? 'error'}
          confirmLabel={cartAlert?.confirmLabel}
          onClose={closeCartAlert}
        />
        <Header
          title="장바구니"
          onFavoriteClick={onFavoritesClick}
          onNotificationsClick={onNotificationsClick}
        />

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
                      보유 쿠폰은 <span className="text-primary font-bold">쿠폰함</span>에서 확인할 수 있어요
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

          {/* 다회용기 포장 (할인은 서버 적용) */}
          <section className={styles.ecoSection}>
            <label className={styles.ecoLabel}>
              <input
                type="checkbox"
                checked={useMultiUseContainer}
                onChange={(e) => setUseMultiUseContainer(e.target.checked)}
                className={styles.ecoCheckbox}
              />
              <span className={styles.ecoTextWrap}>
                <span className={styles.ecoTitle}>다회용기 포장으로 받을게요</span>
                <span className={styles.ecoHint}>
                  선택 시 200원 할인이 적용됩니다. 할인 반영은 결제 단계에서 서버 기준입니다.
                </span>
              </span>
            </label>
          </section>

          {/* 결제 금액 */}
          <section className={styles.summarySection}>
            <h2 className={styles.summaryTitle}>결제 금액</h2>
            
            <div className={styles.summaryCard}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>주문 금액</span>
                <span className={styles.summaryValue}>{formatPrice(subtotal)}</span>
              </div>

              {useApiCart && pricingPreview != null && pricingPreview.tierDiscountAmount > 0 && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryDiscountLabel}>등급 할인 (예상)</span>
                  <span className={styles.summaryDiscountValue}>
                    -{formatPrice(pricingPreview.tierDiscountAmount)}
                  </span>
                </div>
              )}

              {useApiCart && pricingPreview != null && pricingPreview.couponDiscountAmount > 0 && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryDiscountLabel}>
                    쿠폰 할인 (예상)
                    {appliedCoupon ? ` · ${appliedCoupon.name}` : ''}
                  </span>
                  <span className={styles.summaryDiscountValue}>
                    -{formatPrice(pricingPreview.couponDiscountAmount)}
                  </span>
                </div>
              )}

              {!useApiCart && appliedCoupon && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryDiscountLabel}>
                    쿠폰 할인 ({appliedCoupon.name})
                  </span>
                  <span className={styles.summaryDiscountValue}>
                    -{formatPrice(appliedCoupon.discount)}
                  </span>
                </div>
              )}

              {useApiCart && pricingPreview == null && appliedCoupon && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryDiscountLabel}>선택한 쿠폰</span>
                  <span className={styles.summaryValue}>{appliedCoupon.name}</span>
                </div>
              )}

              {useApiCart && pricingPreview != null && (
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
                  쿠폰은 결제 승인 성공 시에만 사용 처리됩니다. 주문 금액 검증은 장바구니 합계{' '}
                  <strong>{formatPrice(subtotal)}</strong> 기준입니다.
                </p>
              )}

              {useMultiUseContainer && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryDiscountLabel}>다회용기 할인 (예상)</span>
                  <span className={styles.summaryDiscountValue}>
                    -{formatPrice(ECO_DISCOUNT_AMOUNT)}
                  </span>
                </div>
              )}

              <div className={styles.summaryTotalRow}>
                <span className={styles.summaryTotalLabel}>예상 결제 금액</span>
                <span className={styles.summaryTotalValue}>{formatPrice(payAmount)}</span>
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
                  <span>{formatPrice(payAmount)} 결제하기</span>
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
