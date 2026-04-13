/**
 * 장바구니 API — /api/v1/carts (인증 필요)
 */
import { apiV1FetchPlain } from './authClient'

export interface CartOptionLineDto {
  optionId: number
  optionName: string
  additionalPrice: number
}

export interface CartItemLineDto {
  cartId: number
  menuId: number
  menuName: string
  menuPrice: number
  quantity: number
  requestMemo: string | null
  options: CartOptionLineDto[]
  itemTotalPrice: number
}

export interface CartListDto {
  storeId?: number | null
  storeName?: string | null
  cartItems: CartItemLineDto[]
  totalCartPrice: number
}

export interface CartAddBody {
  storeId: number
  menuId: number
  quantity: number
  requestMemo?: string
  optionIds: number[]
}

const MENU_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1550547660-d9450f859349?w=200&h=200&fit=crop',
]

/** 카트 줄 단위 UI 모델 (App·CartPage 공용) */
export interface ServerCartLineUi {
  /** 서버 장바구니 줄 ID (DELETE / 수량 변경 시 사용) */
  id: number
  menuId: number
  name: string
  options: string
  /** 1개당 가격(메뉴+옵션) */
  price: number
  quantity: number
  image?: string
  optionIds: number[]
  requestMemo: string
}

function optionSummary(opts: CartOptionLineDto[]): string {
  if (!opts.length) return '옵션 없음'
  return opts.map((o) => o.optionName).join(', ')
}

function lineImage(menuId: number): string {
  return MENU_FALLBACK_IMAGES[Math.abs(Number(menuId)) % MENU_FALLBACK_IMAGES.length]
}

export function mapCartListToUiLines(data: CartListDto): ServerCartLineUi[] {
  return data.cartItems.map((it) => {
    const unit =
      it.quantity > 0 ? Math.round(it.itemTotalPrice / it.quantity) : it.menuPrice
    return {
      id: it.cartId,
      menuId: it.menuId,
      name: it.menuName,
      options: optionSummary(it.options),
      price: unit,
      quantity: it.quantity,
      image: lineImage(it.menuId),
      optionIds: it.options.map((o) => o.optionId),
      requestMemo: it.requestMemo ?? '',
    }
  })
}

export function fetchMyCart() {
  return apiV1FetchPlain<CartListDto>('/carts', { method: 'GET' })
}

export function addCartItem(body: CartAddBody) {
  return apiV1FetchPlain<string>('/carts', {
    method: 'POST',
    body: JSON.stringify({
      storeId: body.storeId,
      menuId: body.menuId,
      quantity: body.quantity,
      requestMemo: body.requestMemo ?? '',
      optionIds: body.optionIds,
    }),
  })
}

export function deleteCartItem(cartId: number) {
  return apiV1FetchPlain<string>(`/carts/${cartId}`, { method: 'DELETE' })
}

export function clearCart() {
  return apiV1FetchPlain<string>('/carts', { method: 'DELETE' })
}
