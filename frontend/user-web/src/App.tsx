/**
 * App.tsx
 * 앱 루트 컴포넌트
 * - 현재 페이지 상태 관리 및 라우팅(페이지 전환)
 * - 전역 상태: 장바구니, 적용 쿠폰, 진행 중 주문 여부, 리뷰 작성 대상 매장명
 * - 로그인 여부에 따라 홈 또는 로그인에서 시작
 *
 */

import { useCallback, useEffect, useState } from 'react'
import {
  LoginPage,
  SignUpPage,
  FindIdPage,
  FindPasswordPage,
  HomePage,
  CategoryDetailPage,
  StoreDetailPage,
  MenuDetailPage,
  CartPage,
  OrderHistoryPage,
  OrderStatusPage,
  CouponSelectPage,
  MapPage,
  MyPage,
  MyReviewsPage,
  ReviewWritePage,
  FavoritesPage,
  NotificationsPage,
  RankingPage,
} from './pages'
import { SimpleAlertModal } from './components'
import { clearTokens, getAccessToken } from './lib/authStorage'
import { pruneUnpaidLocalOrders } from './lib/orderResolve'
import { useActivePickup } from './hooks/useActivePickup'
import { fetchMyCart, mapCartListToUiLines, type ServerCartLineUi } from './api/cart'
import type { ReviewWritePayload } from './api/reviews'
import type { NotificationNavigateTarget } from './lib/notificationNavigation'

/** 앱에서 사용하는 모든 페이지 식별자 */
type Page = 'login' | 'signup' | 'findId' | 'findPassword' | 'home' | 'category' | 'store' | 'menu' | 'cart' | 'orders' | 'orderStatus' | 'coupon' | 'map' | 'mypage' | 'myReviews' | 'reviewWrite' | 'favorites' | 'notifications' | 'ranking'

/** 장바구니에 적용된 쿠폰 정보 */
interface AppliedCoupon {
  id: number
  name: string
  discount: number
}

/** 장바구니 줄 — 서버 GET /carts 매핑 결과와 동일 구조 */
type CartItem = ServerCartLineUi

function App() {
  /** 현재 화면에 표시할 페이지 */
  const [currentPage, setCurrentPage] = useState<Page>(() => (getAccessToken() ? 'home' : 'login'))
  /** 직전에 보고 있던 페이지 (뒤로가기용) */
  const [lastPage, setLastPage] = useState<Page | null>(null)
  /** 장바구니에서 사용 중인 쿠폰 (미사용 시 null) */
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  /** 리뷰 작성 페이지로 넘길 주문·매장 정보 */
  const [reviewWriteTarget, setReviewWriteTarget] = useState<ReviewWritePayload | null>(null)
  const [couponHighlightExpiring, setCouponHighlightExpiring] = useState(false)
  /** 장바구니 상품 목록 (로그인 시 GET /api/v1/carts) */
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartStoreId, setCartStoreId] = useState<number | null>(null)
  const [cartStoreName, setCartStoreName] = useState<string | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null)
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null)
  /** 알림 → 주문 현황 등 특정 주문으로 열 때 */
  const [focusOrderId, setFocusOrderId] = useState<number | null>(null)

  const {
    activeOrder,
    destination: pickupDestination,
    hasActivePickup,
    hasWaitingAccept,
    rejectNotice,
    dismissRejectNotice,
    loading: pickupContextLoading,
    refresh: refreshActivePickup,
  } = useActivePickup(focusOrderId)

  /** 사장님 수락 이후만 주문현황·픽업 경로 배너 */
  const hasActiveOrder = hasActivePickup

  const handleRejectNoticeClose = useCallback(() => {
    dismissRejectNotice()
    setFocusOrderId(null)
    void refreshActivePickup()
    setCurrentPage('orders')
  }, [dismissRejectNotice, refreshActivePickup])

  /** 수락 전에는 주문현황에 머물지 않음 (거절 모달 표시 중에는 유지) */
  useEffect(() => {
    if (currentPage !== 'orderStatus') return
    if (pickupContextLoading) return
    if (rejectNotice) return
    if (hasWaitingAccept) {
      setFocusOrderId(null)
      setCurrentPage('orders')
    }
  }, [currentPage, hasWaitingAccept, pickupContextLoading, rejectNotice])

  /** 리뷰 작성/수정 진입 — 뒤로가기 시 직전 화면으로 복귀 */
  const openReviewWrite = useCallback(
    (payload: ReviewWritePayload, returnPage?: Page) => {
      setLastPage(returnPage ?? currentPage)
      setReviewWriteTarget(payload)
      setCurrentPage('reviewWrite')
    },
    [currentPage],
  )

  const closeReviewWrite = useCallback(() => {
    const fallback: Page = reviewWriteTarget?.reviewId ? 'myReviews' : 'orders'
    let returnTo = lastPage ?? fallback
    if (returnTo === 'reviewWrite') returnTo = fallback
    // 픽업 현황에서 작성한 경우 완료된 주문현황에 남지 않도록 주문내역/내리뷰로
    if (returnTo === 'orderStatus') returnTo = reviewWriteTarget?.reviewId ? 'myReviews' : 'orders'
    setReviewWriteTarget(null)
    setFocusOrderId(null)
    setCurrentPage(returnTo)
  }, [lastPage, reviewWriteTarget?.reviewId])

  /** 직전 화면으로 복귀 (현재 페이지·리뷰작성 화면은 제외) */
  const goBackFrom = useCallback(
    (from: Page, fallback: Page) => () => {
      const dest =
        lastPage && lastPage !== from && lastPage !== 'reviewWrite' ? lastPage : fallback
      setCurrentPage(dest)
    },
    [lastPage],
  )

  const navigateFromNotification = useCallback((target: NotificationNavigateTarget) => {
    setLastPage('notifications')
    switch (target.type) {
      case 'orders':
        setFocusOrderId(null)
        setCurrentPage('orders')
        break
      case 'orderStatus':
        setFocusOrderId(target.orderId)
        setCurrentPage('orderStatus')
        break
      case 'reviewWrite':
        openReviewWrite(target.payload, 'notifications')
        break
      case 'coupon':
        setCouponHighlightExpiring(Boolean(target.highlightExpiringSoon))
        setCurrentPage('coupon')
        break
      default:
        break
    }
  }, [openReviewWrite])

  const refreshCart = useCallback(async () => {
    if (!getAccessToken()) {
      setCartItems([])
      setCartStoreId(null)
      setCartStoreName(null)
      return
    }
    try {
      const data = await fetchMyCart()
      setCartStoreId(data.storeId ?? null)
      setCartStoreName(data.storeName ?? null)
      setCartItems(mapCartListToUiLines(data))
    } catch {
      setCartItems([])
      setCartStoreId(null)
      setCartStoreName(null)
    }
  }, [])

  useEffect(() => {
    void refreshCart()
  }, [refreshCart])

  useEffect(() => {
    pruneUnpaidLocalOrders()
  }, [])

  useEffect(() => {
    if (currentPage === 'menu' && selectedMenuId === null) {
      setCurrentPage('store')
    }
  }, [currentPage, selectedMenuId])

  useEffect(() => {
    if (currentPage === 'store' && selectedStoreId == null) {
      setCurrentPage('category')
    }
  }, [currentPage, selectedStoreId])

  /** 장바구니 총 수량 (하단 네비 뱃지 등에 사용) */
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const openStoreById = (storeId: number) => {
    setSelectedStoreId(storeId)
    setLastPage(currentPage)
    setCurrentPage('store')
  }

  /** 특정 페이지로 이동하는 핸들러 생성 (이벤트 핸들러에 바인딩용) */
  const goTo = (page: Page) => () => {
    setLastPage(currentPage)
    setCurrentPage(page)
  }

  /** currentPage 값에 따라 해당 페이지 컴포넌트 반환 */
  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return (
          <LoginPage
            onLogin={() => {
              void refreshCart()
              setLastPage(currentPage)
              setCurrentPage('home')
            }}
            onSignUp={goTo('signup')}
            onForgotId={goTo('findId')}
            onForgotPassword={goTo('findPassword')}
          />
        )
      case 'signup':
        return <SignUpPage onSignUp={goTo('login')} onBack={goTo('login')} />
      case 'findId':
        return <FindIdPage onBack={goTo('login')} onGoToFindPassword={goTo('findPassword')} />
      case 'findPassword':
        return <FindPasswordPage onBack={goTo('login')} onGoToFindId={goTo('findId')} />
      case 'home':
        return (
          <HomePage 
            onCategoryClick={goTo('category')} 
            onCartClick={goTo('cart')} 
            onOrdersClick={goTo('orders')}
            onOrderStatusClick={goTo('orderStatus')}
            onMapClick={goTo('map')}
            onMypageClick={goTo('mypage')}
            onFavoritesClick={goTo('favorites')}
            onNotificationsClick={goTo('notifications')}
            onStoreSelect={openStoreById}
            onRankingClick={goTo('ranking')}
            hasActiveOrder={hasActiveOrder}
            activeOrderLabel={activeOrder?.storeName ?? pickupDestination?.name}
            cartCount={cartCount}
          />
        )
      case 'ranking':
        return (
          <RankingPage
            onBack={goTo('home')}
            onGoHome={goTo('home')}
            onCartClick={goTo('cart')}
            onOrdersClick={goTo('orders')}
            onMapClick={goTo('map')}
            onMypageClick={goTo('mypage')}
            cartCount={cartCount}
          />
        )
      case 'category':
        return (
          <CategoryDetailPage
            onBack={goTo('home')}
            onGoHome={goTo('home')}
            onStoreSelect={openStoreById}
            onCartClick={goTo('cart')}
            onOrdersClick={goTo('orders')}
            onMapClick={goTo('map')}
            onMypageClick={goTo('mypage')}
            onFavoritesClick={goTo('favorites')}
            onNotificationsClick={goTo('notifications')}
            cartCount={cartCount}
          />
        )
      case 'store':
        if (selectedStoreId == null) return null
        return (
          <StoreDetailPage
            storeId={selectedStoreId}
            onBack={goTo('category')}
            onGoHome={goTo('home')}
            onMenuClick={(menuId) => {
              setSelectedMenuId(menuId)
              goTo('menu')()
            }}
            onCartClick={goTo('cart')}
            onOrdersClick={goTo('orders')}
            onMapClick={goTo('map')}
            onMypageClick={goTo('mypage')}
            onFavoritesClick={goTo('favorites')}
            onNotificationsClick={goTo('notifications')}
            cartCount={cartCount}
            cartTotalPrice={cartTotalPrice}
          />
        )
      case 'menu':
        return selectedMenuId != null && selectedStoreId != null ? (
          <MenuDetailPage
            storeId={selectedStoreId}
            menuId={selectedMenuId}
            onBack={() => {
              setSelectedMenuId(null)
              goTo('store')()
            }}
            onAfterAddToCart={refreshCart}
            onGoToCart={goTo('cart')}
          />
        ) : null
      case 'cart':
        return (
          <CartPage
            onBack={goTo('store')}
            onCheckout={() => {
              void refreshActivePickup()
              setCartItems([])
              setCartStoreId(null)
              setCartStoreName(null)
              // 수락 전에는 주문내역(대기) · 수락 후 현황/경로 노출
              setCurrentPage('orders')
            }}
            onCouponClick={() => {
              setCouponHighlightExpiring(false)
              goTo('coupon')()
            }}
            appliedCoupon={appliedCoupon}
            onRemoveCoupon={() => setAppliedCoupon(null)}
            onGoHome={goTo('home')}
            onOrdersClick={goTo('orders')}
            onMapClick={goTo('map')}
            onMypageClick={goTo('mypage')}
            onFavoritesClick={goTo('favorites')}
            onNotificationsClick={goTo('notifications')}
            cartCount={cartCount}
            cartItems={cartItems}
            onCartItemsChange={(lines) => setCartItems(lines)}
            useApiCart={Boolean(getAccessToken())}
            cartStoreId={cartStoreId}
            onRefreshCart={refreshCart}
            pickupStoreName={cartStoreName}
            onPickupStoreClick={() => {
              if (cartStoreId != null) {
                openStoreById(cartStoreId)
                return
              }
              window.sessionStorage.setItem('categoryActiveTab', '전체')
              goTo('category')()
            }}
          />
        )
      case 'coupon':
        return (
          <CouponSelectPage 
            highlightExpiringSoon={couponHighlightExpiring}
            onClose={() => {
              const back = lastPage && lastPage !== 'coupon' ? lastPage : 'cart'
              setCouponHighlightExpiring(false)
              setCurrentPage(back)
            }}
            onSelect={(coupon) => {
              if (coupon) {
                setAppliedCoupon(coupon)
              }
              setCurrentPage('cart')
            }}
            onGoHome={goTo('home')}
            onCartClick={goTo('cart')}
            onOrdersClick={goTo('orders')}
            onMapClick={goTo('map')}
            onMypageClick={goTo('mypage')}
            cartCount={cartCount}
          />
        )
      case 'orders':
        return (
          <OrderHistoryPage 
            onBack={goTo('home')}
            onGoHome={goTo('home')} 
            onCartClick={goTo('cart')}
            onOrderStatusClick={goTo('orderStatus')}
            onMapClick={goTo('map')}
            onMypageClick={goTo('mypage')}
            onFavoritesClick={goTo('favorites')}
            onNotificationsClick={goTo('notifications')}
            onReviewWriteClick={openReviewWrite}
            hasActiveOrder={hasActiveOrder}
            hasWaitingAccept={hasWaitingAccept}
            activeOrder={activeOrder}
            pickupDestination={pickupDestination}
            cartCount={cartCount}
          />
        )
      case 'orderStatus':
        return (
          <OrderStatusPage 
            onBack={() => {
              setFocusOrderId(null)
              goTo('orders')()
            }}
            onGoHome={goTo('home')} 
            onCartClick={goTo('cart')} 
            onOrdersClick={goTo('orders')}
            onMapClick={goTo('map')}
            onMypageClick={goTo('mypage')}
            onFavoritesClick={goTo('favorites')}
            onNotificationsClick={goTo('notifications')}
            onReviewWriteClick={openReviewWrite}
            onPickupComplete={() => {
              setFocusOrderId(null)
              void refreshActivePickup()
            }}
            activeOrder={activeOrder}
            pickupDestination={pickupDestination}
            pickupContextLoading={pickupContextLoading}
            cartCount={cartCount}
          />
        )
      case 'map':
        return (
          <MapPage 
            onBack={goTo('home')}
            onGoHome={goTo('home')} 
            onCartClick={goTo('cart')} 
            onOrdersClick={goTo('orders')}
            onOrderStatusClick={goTo('orderStatus')}
            onPickupStoreDetail={() => {
              const id = pickupDestination?.storeId ?? activeOrder?.storeId
              if (id) openStoreById(id)
            }}
            onSelectStore={openStoreById}
            onMypageClick={goTo('mypage')}
            onFavoritesClick={goTo('favorites')}
            onNotificationsClick={goTo('notifications')}
            hasActiveOrder={hasActiveOrder}
            pickupDestination={pickupDestination}
            cartCount={cartCount}
          />
        )
      case 'mypage':
        return (
          <MyPage 
            onGoHome={goTo('home')} 
            onCartClick={goTo('cart')} 
            onOrdersClick={goTo('orders')}
            onCouponClick={() => {
              setCouponHighlightExpiring(false)
              goTo('coupon')()
            }}
            onMapClick={goTo('map')}
            onReviewsClick={goTo('myReviews')}
            onFavoritesClick={goTo('favorites')}
            onRankingClick={goTo('ranking')}
            onNotificationsClick={goTo('notifications')}
            onLogout={() => {
              clearTokens()
              setCartItems([])
              setCartStoreId(null)
              setCartStoreName(null)
              setCurrentPage('login')
            }}
            cartCount={cartCount}
          />
        )
      case 'myReviews':
        return (
          <MyReviewsPage 
            onBack={goBackFrom('myReviews', 'mypage')}
            onWriteReview={() => {
              setLastPage('myReviews')
              setCurrentPage('orders')
            }}
            onEditReview={(payload) => openReviewWrite(payload, 'myReviews')}
            onBackToMypage={goTo('mypage')}
            onGoHome={goTo('home')}
            onCartClick={goTo('cart')}
            onOrdersClick={goTo('orders')}
            onMapClick={goTo('map')}
            onMypageClick={goTo('mypage')}
            cartCount={cartCount}
          />
        )
      case 'reviewWrite':
        return (
          <ReviewWritePage 
            storeName={reviewWriteTarget?.storeName ?? ''}
            orderId={reviewWriteTarget?.orderId ?? 0}
            storeId={reviewWriteTarget?.storeId ?? 0}
            reviewId={reviewWriteTarget?.reviewId}
            onBack={closeReviewWrite}
            onSubmitted={closeReviewWrite}
            onGoHome={goTo('home')}
            onCartClick={goTo('cart')}
            onOrdersClick={goTo('orders')}
            onMapClick={goTo('map')}
            onMypageClick={goTo('mypage')}
            cartCount={cartCount}
          />
        )
      case 'favorites':
        return (
          <FavoritesPage 
            onBack={() => {
              if (lastPage) {
                setCurrentPage(lastPage)
              } else {
                setCurrentPage('mypage')
              }
            }}
            onGoHome={goTo('home')}
            onCartClick={goTo('cart')}
            onOrdersClick={goTo('orders')}
            onMapClick={goTo('map')}
            onMypageClick={goTo('mypage')}
            onStoreClick={(storeId) => openStoreById(storeId)}
            cartCount={cartCount}
          />
        )
      case 'notifications':
        return (
          <NotificationsPage
            onBack={goBackFrom('notifications', 'home')}
            onGoHome={goTo('home')}
            onCartClick={goTo('cart')}
            onOrdersClick={goTo('orders')}
            onMapClick={goTo('map')}
            onMypageClick={goTo('mypage')}
            onNavigate={navigateFromNotification}
            cartCount={cartCount}
          />
        )
      default:
        /** 정의되지 않은 페이지일 경우 홈으로 폴백 */
        return (
          <HomePage
            onCategoryClick={goTo('category')}
            hasActiveOrder={hasActiveOrder}
          />
        )
    }
  }

  return (
    <>
      {renderPage()}
      <SimpleAlertModal
        open={rejectNotice != null}
        title="주문이 거절되었어요"
        message={
          rejectNotice?.reason ??
          '매장 사정으로 주문을 받을 수 없습니다. 결제는 환불 처리됩니다.'
        }
        confirmLabel="주문내역 보기"
        variant="error"
        onClose={handleRejectNoticeClose}
      />
    </>
  )
}

export default App
