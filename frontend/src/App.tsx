/**
 * App.tsx
 * 앱 루트 컴포넌트
 * - 현재 페이지 상태 관리 및 라우팅(페이지 전환)
 * - 전역 상태: 장바구니, 적용 쿠폰, 진행 중 주문 여부, 리뷰 작성 대상 매장명
 * - 로딩 → 로그인 → 각 페이지로 이동 처리
 */

import { useState, useEffect } from 'react'
import {
  LoadingPage,
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
} from './pages'
import { FEATURED_RESTAURANTS } from './constants'

/** 앱에서 사용하는 모든 페이지 식별자 */
type Page = 'loading' | 'login' | 'signup' | 'findId' | 'findPassword' | 'home' | 'category' | 'store' | 'menu' | 'cart' | 'orders' | 'orderStatus' | 'coupon' | 'map' | 'mypage' | 'myReviews' | 'reviewWrite' | 'favorites'

/** 장바구니에 적용된 쿠폰 정보 */
interface AppliedCoupon {
  id: number
  name: string
  discount: number
}

/** 장바구니에 담긴 단일 상품 */
interface CartItem {
  id: number
  name: string
  options: string
  price: number
  quantity: number
  image?: string
}

/** 개발/데모용 초기 장바구니 데이터 (홈 카드와 통일) */
const initialCartItems: CartItem[] = [
  {
    id: FEATURED_RESTAURANTS[0].id,
    name: FEATURED_RESTAURANTS[0].title,
    options: '기본 선택 / 소스 추가',
    price: 100,
    quantity: 1,
    image: FEATURED_RESTAURANTS[0].image,
  },
]

function App() {
  /** 현재 화면에 표시할 페이지 */
  const [currentPage, setCurrentPage] = useState<Page>('loading')
  /** 직전에 보고 있던 페이지 (뒤로가기용) */
  const [lastPage, setLastPage] = useState<Page | null>(null)
  /** 장바구니에서 사용 중인 쿠폰 (미사용 시 null) */
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  /** 진행 중인 주문이 있는지 (지도/주문현황 연동) */
  const [hasActiveOrder, setHasActiveOrder] = useState(false)
  /** 리뷰 작성 페이지로 넘길 매장명 (주문내역 → 리뷰쓰기) */
  const [reviewStoreName, setReviewStoreName] = useState('')
  /** 장바구니 상품 목록 (CartPage에서 수정 가능) */
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems)

  /** 장바구니 총 수량 (하단 네비 뱃지 등에 사용) */
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  /** 로딩 페이지 3초 후 로그인 페이지로 자동 전환 */
  useEffect(() => {
    if (currentPage === 'loading') {
      const timer = setTimeout(() => setCurrentPage('login'), 3000)
      return () => clearTimeout(timer)
    }
  }, [currentPage])

  /** 특정 페이지로 이동하는 핸들러 생성 (이벤트 핸들러에 바인딩용) */
  const goTo = (page: Page) => () => {
    setLastPage(currentPage)
    setCurrentPage(page)
  }

  /** currentPage 값에 따라 해당 페이지 컴포넌트 반환 */
  const renderPage = () => {
    switch (currentPage) {
      case 'loading':
        return <LoadingPage />
      case 'login':
        return (
          <LoginPage 
            onLogin={goTo('home')} 
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
            hasActiveOrder={hasActiveOrder}
            cartCount={cartCount}
          />
        )
      case 'category':
        return <CategoryDetailPage onBack={goTo('home')} onGoHome={goTo('home')} onStoreClick={goTo('store')} onCartClick={goTo('cart')} onOrdersClick={goTo('orders')} onMapClick={goTo('map')} onMypageClick={goTo('mypage')} onFavoritesClick={goTo('favorites')} cartCount={cartCount} />
      case 'store':
        return <StoreDetailPage onBack={goTo('category')} onGoHome={goTo('home')} onMenuClick={goTo('menu')} onCartClick={goTo('cart')} onOrdersClick={goTo('orders')} onMapClick={goTo('map')} onMypageClick={goTo('mypage')} onFavoritesClick={goTo('favorites')} cartCount={cartCount} />
      case 'menu':
        return <MenuDetailPage onBack={goTo('store')} onAddToCart={goTo('cart')} />
      case 'cart':
        return (
          <CartPage 
            onBack={goTo('store')} 
            onCheckout={() => {
              setHasActiveOrder(true)
              setCartItems([])
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
            cartCount={cartCount}
            cartItems={cartItems}
            onCartItemsChange={setCartItems}
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
            onReviewWriteClick={(storeName) => {
              setReviewStoreName(storeName)
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
            onStoreClick={goTo('store')}
            onMypageClick={goTo('mypage')}
            onFavoritesClick={goTo('favorites')}
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
            cartCount={cartCount}
          />
        )
      case 'myReviews':
        return (
          <MyReviewsPage 
            onBack={goTo('mypage')}
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
            storeName={reviewStoreName}
            onBack={goTo('orders')}
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
            onStoreClick={goTo('store')}
            cartCount={cartCount}
          />
        )
      default:
        /** 정의되지 않은 페이지일 경우 홈으로 폴백 */
        return <HomePage onCategoryClick={goTo('category')} />
    }
  }

  return renderPage()
}

export default App
