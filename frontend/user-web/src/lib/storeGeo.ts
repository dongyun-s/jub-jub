/**
 * 매장 좌표·주소 — 사장님 매장(address→TMAP 좌표)과 고객 앱 정렬
 * 우선순위: 호출측 override → 목록 API → 상세 API(있을 때)
 */
import { fetchStoreDetail, fetchStores, type StoreListItem } from '../api/store'
import { STORE_LIST_CARD_IMAGES } from '../constants'

export type StoreGeo = {
  storeId: number
  name: string
  address: string
  lat: number
  lng: number
  imageUrl: string
  categoryName?: string
}

export type StoreGeoOverride = {
  lat?: number | null
  lng?: number | null
  address?: string | null
  name?: string | null
  categoryName?: string | null
}

let listCache: StoreListItem[] | null = null
let listCacheAt = 0
const CACHE_MS = 60_000

export function storeCardImage(storeId: number): string {
  return STORE_LIST_CARD_IMAGES[Math.abs(storeId) % STORE_LIST_CARD_IMAGES.length]
}

async function getStoresCached(): Promise<StoreListItem[]> {
  const now = Date.now()
  if (listCache && now - listCacheAt < CACHE_MS) return listCache
  listCache = await fetchStores()
  listCacheAt = now
  return listCache
}

export function invalidateStoreListCache() {
  listCache = null
  listCacheAt = 0
}

function pickCoords(
  lat: number | null | undefined,
  lng: number | null | undefined,
): { lat: number; lng: number } | null {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat === 0 && lng === 0) return null
  return { lat, lng }
}

/** storeId 기준 위경도·주소 (사장님 등록 좌표 우선 소비) */
export async function fetchStoreGeo(
  storeId: number,
  override?: StoreGeoOverride | null,
): Promise<StoreGeo | null> {
  if (!storeId) return null

  const list = await getStoresCached().catch(() => [] as StoreListItem[])
  const row = list.find((s) => s.storeId === storeId)

  let address = override?.address?.trim() || ''
  let detailLat: number | null = null
  let detailLng: number | null = null
  let detailName = ''
  try {
    const detail = await fetchStoreDetail(storeId)
    address = address || detail.address?.trim() || ''
    detailName = detail.name?.trim() || ''
    const dLat = detail.latitude ?? null
    const dLng = detail.longitude ?? null
    const fromDetail = pickCoords(dLat, dLng)
    if (fromDetail) {
      detailLat = fromDetail.lat
      detailLng = fromDetail.lng
    }
  } catch {
    /* 주소·상세 좌표만 상세에서 */
  }

  const picked =
    pickCoords(override?.lat, override?.lng) ??
    pickCoords(row?.latitude, row?.longitude) ??
    pickCoords(detailLat, detailLng)

  if (!picked) return null

  return {
    storeId,
    name: override?.name?.trim() || row?.name?.trim() || detailName || `매장 #${storeId}`,
    address,
    lat: picked.lat,
    lng: picked.lng,
    imageUrl: storeCardImage(storeId),
    categoryName: override?.categoryName?.trim() || row?.categoryName?.trim() || undefined,
  }
}

export function buildStoreNameToIdMap(list: StoreListItem[]): Record<string, number> {
  const m: Record<string, number> = {}
  for (const s of list) {
    const n = s.name?.trim()
    if (n && m[n] === undefined) m[n] = s.storeId
  }
  return m
}
