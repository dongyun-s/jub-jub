/**
 * 장바구니 API — /api/v1/carts (인증 필요)
 */
import { apiV1FetchPlain } from './authClient'
import { resolveMenuImageUrl } from '../lib/menuImage'

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
  imageUrl?: string | null
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
      image: resolveMenuImageUrl(it.imageUrl),
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

function sameOptionIds(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  const as = [...a].sort((x, y) => x - y)
  const bs = [...b].sort((x, y) => x - y)
  return as.every((id, i) => id === bs[i])
}

/**
 * 동일 메뉴·옵션·요청사항이 이미 있으면 수량만 합침.
 * (백엔드 POST가 항상 새 줄을 만들므로 FE에서 DELETE 후 합산 POST로 우회)
 */
export async function addOrMergeCartItem(body: CartAddBody): Promise<void> {
  const qty = Math.max(1, body.quantity)
  const memo = body.requestMemo ?? ''
  const optionIds = body.optionIds ?? []

  let existing: CartItemLineDto | undefined
  try {
    const cart = await fetchMyCart()
    existing = cart.cartItems.find(
      (it) =>
        it.menuId === body.menuId &&
        (it.requestMemo ?? '') === memo &&
        sameOptionIds(
          it.options.map((o) => o.optionId),
          optionIds,
        ),
    )
  } catch {
    existing = undefined
  }

  if (existing) {
    await deleteCartItem(existing.cartId)
    await addCartItem({
      ...body,
      quantity: existing.quantity + qty,
      requestMemo: memo,
      optionIds,
    })
    return
  }

  await addCartItem({ ...body, quantity: qty, requestMemo: memo, optionIds })
}

export function deleteCartItem(cartId: number) {
  return apiV1FetchPlain<string>(`/carts/${cartId}`, { method: 'DELETE' })
}

export function clearCart() {
  return apiV1FetchPlain<string>('/carts', { method: 'DELETE' })
}
