/**
 * 매장·메뉴 API — GET /api/v1/stores, GET /api/v1/stores/{storeId}
 */
import { apiV1Fetch, apiV1FetchPlain } from './authClient'

export interface StoreListItem {
  storeId: number
  name: string
  categoryId: number
  categoryName?: string
  cookingTimeMinutes: number
  minOrderAmount: number
  latitude: number | null
  longitude: number | null
}

export interface MenuOptionDto {
  optionId: number
  name: string
  additionalPrice: number
  isRequired: boolean
}

export interface MenuDto {
  menuId: number
  name: string
  price: number
  description: string
  isSoldOut: boolean
  rewardXp: number
  /** 사장님 등록 메뉴 이미지 (없으면 null/미포함) */
  imageUrl?: string | null
  options: MenuOptionDto[]
}

export interface StoreDetailDto {
  storeId: number
  name: string
  address: string
  phoneNumber: string
  originInfo: string
  cookingTimeMinutes: number
  minOrderAmount: number
  /** 사장님 주소→좌표 변환 결과 (응답에 있으면 사용) */
  latitude?: number | null
  longitude?: number | null
  categoryId?: number | null
  categoryName?: string | null
  menus: MenuDto[]
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (!Number.isNaN(n)) return n
  }
  return fallback
}

function normalizeStoreListItem(raw: unknown): StoreListItem | null {
  if (typeof raw !== 'object' || raw === null) return null
  const p = raw as Record<string, unknown>
  const storeId = num(p.storeId ?? p.store_id ?? p.id)
  const name = String(p.name ?? '').trim()
  if (!storeId || !name) return null
  return {
    storeId,
    name,
    categoryId: num(p.categoryId ?? p.category_id),
    categoryName: String(p.categoryName ?? p.category_name ?? '').trim() || undefined,
    cookingTimeMinutes: num(p.cookingTimeMinutes ?? p.cooking_time_minutes, 15),
    minOrderAmount: num(p.minOrderAmount ?? p.min_order_amount),
    latitude:
      p.latitude != null && p.latitude !== ''
        ? num(p.latitude)
        : p.lat != null
          ? num(p.lat)
          : null,
    longitude:
      p.longitude != null && p.longitude !== ''
        ? num(p.longitude)
        : p.lng != null
          ? num(p.lng)
          : null,
  }
}

function parseStoreList(body: unknown): StoreListItem[] {
  if (Array.isArray(body)) {
    return body.map(normalizeStoreListItem).filter(Boolean) as StoreListItem[]
  }
  if (typeof body === 'object' && body !== null) {
    const o = body as Record<string, unknown>
    if (o.success === true && Array.isArray(o.data)) {
      return parseStoreList(o.data)
    }
    const arr = o.data ?? o.stores ?? o.items
    if (Array.isArray(arr)) return parseStoreList(arr)
  }
  return []
}

export type FetchStoresParams = {
  categoryId?: number
  category?: string
}

/** GET /api/v1/stores — 카테고리 필터 optional */
export async function fetchStores(params?: FetchStoresParams): Promise<StoreListItem[]> {
  const q = new URLSearchParams()
  if (params?.categoryId != null) q.set('categoryId', String(params.categoryId))
  if (params?.category?.trim()) q.set('category', params.category.trim())
  const suffix = q.toString() ? `?${q.toString()}` : ''

  try {
    const wrapped = await apiV1Fetch<unknown>(`/stores${suffix}`)
    const list = parseStoreList(wrapped)
    if (list.length > 0) return list
  } catch {
    /* plain 응답·래핑 차이 폴백 */
  }

  try {
    const plain = await apiV1FetchPlain<unknown>(`/stores${suffix}`)
    return parseStoreList(plain)
  } catch {
    return []
  }
}

export async function fetchStoreDetail(storeId: number): Promise<StoreDetailDto> {
  const raw = await apiV1Fetch<Record<string, unknown>>(`/stores/${storeId}`)
  const p = raw && typeof raw === 'object' ? raw : {}
  return {
    storeId: num(p.storeId ?? p.store_id ?? storeId),
    name: String(p.name ?? '').trim(),
    address: String(p.address ?? '').trim(),
    phoneNumber: String(p.phoneNumber ?? p.phone_number ?? '').trim(),
    originInfo: String(p.originInfo ?? p.origin_info ?? '').trim(),
    cookingTimeMinutes: num(p.cookingTimeMinutes ?? p.cooking_time_minutes, 15),
    minOrderAmount: num(p.minOrderAmount ?? p.min_order_amount),
    latitude:
      p.latitude != null && p.latitude !== ''
        ? num(p.latitude)
        : p.lat != null
          ? num(p.lat)
          : null,
    longitude:
      p.longitude != null && p.longitude !== ''
        ? num(p.longitude)
        : p.lng != null
          ? num(p.lng)
          : null,
    categoryId: p.categoryId != null ? num(p.categoryId ?? p.category_id) : null,
    categoryName: String(p.categoryName ?? p.category_name ?? '').trim() || null,
    menus: Array.isArray(p.menus) ? p.menus.map(normalizeMenuDto).filter((m): m is MenuDto => m != null) : [],
  }
}

function normalizeMenuDto(raw: unknown): MenuDto | null {
  if (typeof raw !== 'object' || raw === null) return null
  const m = raw as Record<string, unknown>
  const menuId = num(m.menuId ?? m.menu_id)
  const name = String(m.name ?? '').trim()
  if (!menuId || !name) return null
  const imageRaw = m.imageUrl ?? m.image_url ?? m.imagePath ?? m.image_path ?? m.image
  const imageUrl =
    typeof imageRaw === 'string' && imageRaw.trim() !== '' ? imageRaw.trim() : null
  const optionsRaw = Array.isArray(m.options) ? m.options : []
  return {
    menuId,
    name,
    price: num(m.price),
    description: String(m.description ?? '').trim(),
    isSoldOut: Boolean(m.isSoldOut ?? m.is_sold_out),
    rewardXp: num(m.rewardXp ?? m.reward_xp),
    imageUrl,
    options: optionsRaw
      .map((o) => {
        if (typeof o !== 'object' || o === null) return null
        const opt = o as Record<string, unknown>
        const optionId = num(opt.optionId ?? opt.option_id)
        const optName = String(opt.name ?? '').trim()
        if (!optionId || !optName) return null
        return {
          optionId,
          name: optName,
          additionalPrice: num(opt.additionalPrice ?? opt.additional_price),
          isRequired: Boolean(opt.isRequired ?? opt.is_required),
        } satisfies MenuOptionDto
      })
      .filter((o): o is MenuOptionDto => o != null),
  }
}

export type StoreSortBy = 'DISTANCE' | 'RATING'

export interface SortedStoreListItem {
  storeId: number
  name: string
  categoryId: number
  categoryName?: string
  cookingTimeMinutes: number
  minOrderAmount: number
  latitude: number | null
  longitude: number | null
  distanceMeters: number
  averageRating: number
  reviewCount: number
}

export type FetchSortedStoresParams = {
  sortBy: StoreSortBy
  latitude: number
  longitude: number
  categoryId?: number
  category?: string
}

function normalizeSortedStoreItem(raw: unknown): SortedStoreListItem | null {
  if (typeof raw !== 'object' || raw === null) return null
  const p = raw as Record<string, unknown>
  const storeId = num(p.storeId ?? p.store_id ?? p.id)
  const name = String(p.name ?? '').trim()
  if (!storeId || !name) return null
  return {
    storeId,
    name,
    categoryId: num(p.categoryId ?? p.category_id),
    categoryName: String(p.categoryName ?? p.category_name ?? '').trim() || undefined,
    cookingTimeMinutes: num(p.cookingTimeMinutes ?? p.cooking_time_minutes, 15),
    minOrderAmount: num(p.minOrderAmount ?? p.min_order_amount),
    latitude:
      p.latitude != null && p.latitude !== ''
        ? num(p.latitude)
        : p.lat != null
          ? num(p.lat)
          : null,
    longitude:
      p.longitude != null && p.longitude !== ''
        ? num(p.longitude)
        : p.lng != null
          ? num(p.lng)
          : null,
    distanceMeters: num(p.distanceMeters ?? p.distance_meters),
    averageRating: num(p.averageRating ?? p.average_rating, 0),
    reviewCount: num(p.reviewCount ?? p.review_count),
  }
}

function parseSortedStoreList(body: unknown): SortedStoreListItem[] {
  if (Array.isArray(body)) {
    return body.map(normalizeSortedStoreItem).filter(Boolean) as SortedStoreListItem[]
  }
  if (typeof body === 'object' && body !== null) {
    const o = body as Record<string, unknown>
    if (o.success === true && Array.isArray(o.data)) {
      return parseSortedStoreList(o.data)
    }
    const arr = o.data ?? o.stores ?? o.items
    if (Array.isArray(arr)) return parseSortedStoreList(arr)
  }
  return []
}

/** GET /api/v1/stores/sorted — 반경 3km, 거리순·평점순 */
export async function fetchSortedStores(
  params: FetchSortedStoresParams,
): Promise<SortedStoreListItem[]> {
  const q = new URLSearchParams()
  q.set('sortBy', params.sortBy)
  q.set('latitude', String(params.latitude))
  q.set('longitude', String(params.longitude))
  if (params.categoryId != null) q.set('categoryId', String(params.categoryId))
  if (params.category?.trim()) q.set('category', params.category.trim())

  try {
    const wrapped = await apiV1Fetch<unknown>(`/stores/sorted?${q.toString()}`)
    const list = parseSortedStoreList(wrapped)
    if (list.length > 0) return list
  } catch {
    /* plain 폴백 */
  }

  try {
    const plain = await apiV1FetchPlain<unknown>(`/stores/sorted?${q.toString()}`)
    return parseSortedStoreList(plain)
  } catch {
    return []
  }
}
