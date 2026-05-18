/**
 * App.tsx
 * 앱 루트 컴포넌트
 * - 현재 페이지 상태 관리 및 라우팅(페이지 전환)
 * - 전역 상태: 장바구니, 적용 쿠폰, 진행 중 주문 여부, 리뷰 작성 대상 매장명
 * - 로그인 여부에 따라 홈 또는 로그인에서 시작
 *
 * 미리보기(쿼리는 로드 후 주소에서 제거됨):
 * - 지도: ?map=1
 * - 진행 중 주문 UI(홈 배너·지도 픽업 경로·주문내역 카드): ?activeOrder=1
 * - 예: 픽업 지도만 바로: ?map=1&activeOrder=1
 * - 주문 현황 페이지까지: ?orderStatus=1&activeOrder=1
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
import { FEATURED_RESTAURANTS } from './constants'
import { clearTokens, getAccessToken } from './lib/authStorage'
import { fetchMyCart, mapCartListToUiLines, type ServerCartLineUi } from './api/cart'
import type { ReviewWritePayload } from './api/reviews'

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

/**
 * 개발·데모용 URL 쿼리: 초기 페이지·진행 중 주문 여부만 설정하고 쿼리스트링은 제거.
 */
function readLaunchQuery(): { page: Page | null; activeOrder: boolean } {
  if (typeof window === 'undefined') return { page: null, activeOrder: false }
  const q = new URLSearchParams(window.location.search)
  let page: Page | null = null
  if (q.get('orderStatus') === '1') page = 'orderStatus'
  else if (q.get('map') === '1') page = 'map'
  const activeOrder = q.get('activeOrder') === '1' || q.get('orderStatus') === '1'
  if (page !== null || activeOrder) {
    const clean = `${window.location.pathname}${window.location.hash}`
    window.history.replaceState({}, '', clean)
  }
  return { page, activeOrder }
}

function App() {
  const launch = readLaunchQuery()

  /** 현재 화면에 표시할 페이지 */
  const [currentPage, setCurrentPage] = useState<Page>(
    () => launch.page ?? (getAccessToken() ? 'home' : 'login')
  )
  /** 직전에 보고 있던 페이지 (뒤로가기용) */
  const [lastPage, setLastPage] = useState<Page | null>(null)
  /** 장바구니에서 사용 중인 쿠폰 (미사용 시 null) */
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  /** 진행 중인 주문이 있는지 (지도/주문현황 연동) */
  const [hasActiveOrder, setHasActiveOrder] = useState(() => launch.activeOrder)
  /** 리뷰 작성 페이지로 넘길 주문·매장 정보 */
  const [reviewWriteTarget, setReviewWriteTarget] = useState<ReviewWritePayload | null>(null)
  /** 장바구니 상품 목록 (로그인 시 GET /api/v1/carts) */
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartStoreId, setCartStoreId] = useState<number | null>(null)
  const [cartStoreName, setCartStoreName] = useState<string | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState(FEATURED_RESTAURANTS[0].id)
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null)

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
    if (currentPage === 'menu' && selectedMenuId === null) {
      setCurrentPage('store')
    }
  }, [currentPage, selectedMenuId])

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
        return selectedMenuId != null ? (
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
              setHasActiveOrder(true)
              setCartItems([])
              setCartStoreId(null)
              setCartStoreName(null)
              setCurrentPage('orderStatus')
            }}
            onCouponClick={goTo('coupon')}
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
          />
        )
      case 'coupon':
        return (
          <CouponSelectPage 
            onClose={goTo('cart')} 
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
            onReviewWriteClick={(payload) => {
              setReviewWriteTarget(payload)
              setCurrentPage('reviewWrite')
            }}
            hasActiveOrder={hasActiveOrder}
            cartCount={cartCount}
          />
        )
      case 'orderStatus':
        return (
          <OrderStatusPage 
            onBack={goTo('orders')} 
            onGoHome={goTo('home')} 
            onCartClick={goTo('cart')} 
            onOrdersClick={goTo('orders')}
            onMapClick={goTo('map')}
            onMypageClick={goTo('mypage')}
            onFavoritesClick={goTo('favorites')}
            onNotificationsClick={goTo('notifications')}
            onReviewWriteClick={(payload) => {
              setReviewWriteTarget(payload)
              setCurrentPage('reviewWrite')
            }}
            onPickupComplete={() => setHasActiveOrder(false)}
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
            onPickupStoreDetail={() => openStoreById(FEATURED_RESTAURANTS[0].id)}
            onStoreClick={() => openStoreById(FEATURED_RESTAURANTS[0].id)}
            onMypageClick={goTo('mypage')}
            onFavoritesClick={goTo('favorites')}
            onNotificationsClick={goTo('notifications')}
            hasActiveOrder={hasActiveOrder}
            cartCount={cartCount}
          />
        )
      case 'mypage':
        return (
          <MyPage 
            onGoHome={goTo('home')} 
            onCartClick={goTo('cart')} 
            onOrdersClick={goTo('orders')}
            onCouponClick={goTo('coupon')}
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
            onBack={goTo('mypage')}
            onWriteReview={goTo('orders')}
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
            onBack={() => {
              setReviewWriteTarget(null)
              goTo('orders')()
            }}
            onSubmitted={() => {
              setReviewWriteTarget(null)
              setCurrentPage('orders')
            }}
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
            onBack={() => {
              if (lastPage) {
                setCurrentPage(lastPage)
              } else {
                setCurrentPage('home')
              }
            }}
            onGoHome={goTo('home')}
            onCartClick={goTo('cart')}
            onOrdersClick={goTo('orders')}
            onMapClick={goTo('map')}
            onMypageClick={goTo('mypage')}
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

  return renderPage()
}

export default App
