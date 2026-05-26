/**
 * 매장 좌표·주소 — GET /api/v1/stores, GET /api/v1/stores/{id}
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

/** storeId 기준 위경도·주소 (목록 API 좌표 + 상세 주소) */
export async function fetchStoreGeo(storeId: number): Promise<StoreGeo | null> {
  if (!storeId) return null

  const list = await getStoresCached()
  const row = list.find((s) => s.storeId === storeId)

  let address = ''
  try {
    const detail = await fetchStoreDetail(storeId)
    address = detail.address?.trim() || ''
  } catch {
    /* 주소만 상세에서 */
  }

  const lat = row?.latitude
  const lng = row?.longitude
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null
  }

  return {
    storeId,
    name: row?.name?.trim() || `매장 #${storeId}`,
    address,
    lat,
    lng,
    imageUrl: storeCardImage(storeId),
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
