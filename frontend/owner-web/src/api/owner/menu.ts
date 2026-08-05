/**
 * Owner Menu API — /api/v1/owner/menu
 * @see Owner Menu API 명세서_수정.pdf
 *
 * 이미지: Presigned URL → S3 PUT → imageUrl 을 메뉴 등록/수정 body 에 포함
 * (별도 /menu/{id}/image API 없음)
 */
import { apiV1Fetch } from '../authClient'
import { OWNER_API } from './paths'

/** 명세 지원 MenuCategory */
export type OwnerMenuCategory = 'MAIN' | 'SIDE' | 'DRINK'

export const OWNER_MENU_CATEGORIES: { value: OwnerMenuCategory; label: string }[] = [
  { value: 'MAIN', label: '메인' },
  { value: 'SIDE', label: '사이드' },
  { value: 'DRINK', label: '음료' },
]

/** GET 목록 항목 */
export type OwnerMenuListItem = {
  menuId: number
  name: string
  price: number
  description: string
  category: OwnerMenuCategory
  imageUrl: string | null
  isSpicy: boolean
  isVegetarian: boolean
  isBest: boolean
  soldOut: boolean
}

/** POST/PUT 요청 body */
export type OwnerMenuWriteBody = {
  name: string
  description: string
  price: number
  category: OwnerMenuCategory
  /** S3 공개 URL (없으면 빈 문자열/미포함) */
  imageUrl?: string | null
  isSpicy: boolean
  isVegetarian: boolean
  isBest: boolean
}

/** POST/PUT/PATCH data — { menuId, message } */
export type OwnerMenuActionResult = {
  menuId: number
  message: string
}

function menuPath(suffix = ''): string {
  return `${OWNER_API.menu}${suffix}`
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (!Number.isNaN(n)) return n
  }
  return fallback
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function bool(v: unknown, fallback = false): boolean {
  if (typeof v === 'boolean') return v
  if (v === 1 || v === '1' || v === 'true') return true
  if (v === 0 || v === '0' || v === 'false') return false
  return fallback
}

function normalizeCategory(raw: unknown): OwnerMenuCategory {
  const v = str(raw).trim().toUpperCase()
  if (v === 'SIDE') return 'SIDE'
  if (v === 'DRINK' || v === 'BEVERAGE') return 'DRINK'
  return 'MAIN'
}

export function ownerMenuCategoryLabel(category: OwnerMenuCategory | string | null | undefined): string {
  const c = normalizeCategory(category)
  return OWNER_MENU_CATEGORIES.find((x) => x.value === c)?.label ?? c
}

export function normalizeOwnerMenuListItem(raw: unknown): OwnerMenuListItem | null {
  if (typeof raw !== 'object' || raw === null) return null
  const p = raw as Record<string, unknown>
  const menuId = num(p.menuId ?? p.menu_id)
  const name = str(p.name).trim()
  if (menuId <= 0 || !name) return null
  const imageUrl = str(p.imageUrl ?? p.image_url ?? p.imagePath ?? p.image_path).trim()
  return {
    menuId,
    name,
    price: num(p.price),
    description: str(p.description),
    category: normalizeCategory(p.category),
    imageUrl: imageUrl || null,
    isSpicy: bool(p.isSpicy ?? p.is_spicy, false),
    isVegetarian: bool(p.isVegetarian ?? p.is_vegetarian, false),
    isBest: bool(p.isBest ?? p.is_best, false),
    soldOut: bool(p.isSoldOut ?? p.is_sold_out ?? p.soldOut ?? p.sold_out, false),
  }
}

function normalizeActionResult(raw: unknown): OwnerMenuActionResult {
  if (typeof raw !== 'object' || raw === null) {
    return { menuId: 0, message: typeof raw === 'string' ? raw : '' }
  }
  const p = raw as Record<string, unknown>
  return {
    menuId: num(p.menuId ?? p.menu_id),
    message: str(p.message),
  }
}

function writePayload(body: OwnerMenuWriteBody) {
  const imageUrl = body.imageUrl?.trim() || ''
  return {
    name: body.name.trim(),
    description: body.description.trim(),
    price: body.price,
    category: body.category,
    imageUrl,
    isSpicy: body.isSpicy,
    isVegetarian: body.isVegetarian,
    isBest: body.isBest,
  }
}

/** GET /api/v1/owner/menu */
export async function fetchOwnerMenus(): Promise<OwnerMenuListItem[]> {
  const raw = await apiV1Fetch<unknown>(menuPath(), { method: 'GET' })
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeOwnerMenuListItem).filter(Boolean) as OwnerMenuListItem[]
}

/** POST /api/v1/owner/menu */
export async function createOwnerMenu(body: OwnerMenuWriteBody): Promise<OwnerMenuActionResult> {
  const raw = await apiV1Fetch<unknown>(menuPath(), {
    method: 'POST',
    body: JSON.stringify(writePayload(body)),
  })
  return normalizeActionResult(raw)
}

/** PUT /api/v1/owner/menu/{menuId} */
export async function updateOwnerMenu(
  menuId: number,
  body: OwnerMenuWriteBody,
): Promise<OwnerMenuActionResult> {
  const raw = await apiV1Fetch<unknown>(menuPath(`/${menuId}`), {
    method: 'PUT',
    body: JSON.stringify(writePayload(body)),
  })
  return normalizeActionResult(raw)
}

/** DELETE /api/v1/owner/menu/{menuId} — Soft Delete */
export async function deleteOwnerMenu(menuId: number): Promise<string> {
  const raw = await apiV1Fetch<unknown>(menuPath(`/${menuId}`), { method: 'DELETE' })
  if (typeof raw === 'string') return raw
  if (typeof raw === 'object' && raw !== null) {
    const msg = (raw as Record<string, unknown>).message
    if (typeof msg === 'string') return msg
  }
  return '메뉴가 삭제되었습니다.'
}

/**
 * PATCH /api/v1/owner/menu/{menuId}/sold-out?soldOut=true|false
 */
export async function setOwnerMenuSoldOut(
  menuId: number,
  soldOut: boolean,
): Promise<OwnerMenuActionResult> {
  const raw = await apiV1Fetch<unknown>(
    menuPath(`/${menuId}/sold-out?soldOut=${soldOut ? 'true' : 'false'}`),
    { method: 'PATCH' },
  )
  return normalizeActionResult(raw)
}
