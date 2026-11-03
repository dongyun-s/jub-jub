/**
 * 사장님 ↔ 매장 1:1 로컬 세션 (프론트 전용)
 * - 백엔드 OWNER/매장 생성 API 없이 storeId·사업자 정보를 브라우저에 보관합니다.
 */

export type OwnerStoreProfile = {
  email: string
  storeId: number
  businessNumber: string
  storeAddress: string
  storePhone: string
  storeName?: string
}

const STORES_KEY = 'jubjub_owner_stores_by_email'
const ACTIVE_STORE_KEY = 'jubjub_owner_active_store_id'
const MOCK_CREDS_KEY = 'jubjub_owner_mock_creds'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function readStores(): Record<string, OwnerStoreProfile> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORES_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, OwnerStoreProfile>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStores(map: Record<string, OwnerStoreProfile>): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORES_KEY, JSON.stringify(map))
}

function readMockCreds(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(MOCK_CREDS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeMockCreds(map: Record<string, string>): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(MOCK_CREDS_KEY, JSON.stringify(map))
}

/** email당 기존 storeId 재사용, 없으면 새 PK 발급 */
export function resolveOrCreateStoreId(email: string): number {
  const key = normalizeEmail(email)
  const existing = readStores()[key]?.storeId
  if (existing && Number.isFinite(existing) && existing > 0) return Math.floor(existing)

  const used = Object.values(readStores())
    .map((p) => p.storeId)
    .filter((n) => Number.isFinite(n) && n > 0)
  const next = (used.length ? Math.max(...used) : 1000) + 1
  return next
}

export function getOwnerStoreProfile(email: string): OwnerStoreProfile | null {
  const key = normalizeEmail(email)
  return readStores()[key] ?? null
}

export function getActiveOwnerStoreProfile(): OwnerStoreProfile | null {
  const storeId = getActiveStoreId()
  if (storeId == null) return null
  const found = Object.values(readStores()).find((p) => p.storeId === storeId)
  return found ?? null
}

export function saveOwnerStoreProfile(input: {
  email: string
  businessNumber: string
  storeAddress: string
  storePhone: string
  storeName?: string
  storeId?: number
}): OwnerStoreProfile {
  const email = normalizeEmail(input.email)
  const storeId =
    input.storeId && Number.isFinite(input.storeId) && input.storeId > 0
      ? Math.floor(input.storeId)
      : resolveOrCreateStoreId(email)

  const profile: OwnerStoreProfile = {
    email,
    storeId,
    businessNumber: input.businessNumber.trim(),
    storeAddress: input.storeAddress.trim(),
    storePhone: input.storePhone.trim(),
    storeName: input.storeName?.trim() || undefined,
  }

  const map = readStores()
  map[email] = profile
  writeStores(map)
  return profile
}

export function getActiveStoreId(): number | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(ACTIVE_STORE_KEY)
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null
}

export function setActiveStoreId(storeId: number | null): void {
  if (typeof window === 'undefined') return
  if (storeId == null || !Number.isFinite(storeId) || storeId <= 0) {
    window.localStorage.removeItem(ACTIVE_STORE_KEY)
    return
  }
  window.localStorage.setItem(ACTIVE_STORE_KEY, String(Math.floor(storeId)))
}

/** 로그인 시 email → storeId 활성화. 프로필 없으면 null */
export function activateOwnerStoreForEmail(email: string): number | null {
  const profile = getOwnerStoreProfile(email)
  if (!profile) {
    setActiveStoreId(null)
    return null
  }
  setActiveStoreId(profile.storeId)
  return profile.storeId
}

/** 로그아웃 시 활성 매장만 해제 (email↔매장 매핑은 유지) */
export function clearActiveOwnerStore(): void {
  setActiveStoreId(null)
}

export function saveMockOwnerCredential(email: string, password: string): void {
  const key = normalizeEmail(email)
  const map = readMockCreds()
  map[key] = password
  writeMockCreds(map)
}

export function verifyMockOwnerCredential(email: string, password: string): boolean {
  const key = normalizeEmail(email)
  const saved = readMockCreds()[key]
  return Boolean(saved) && saved === password
}

export function hasMockOwnerCredential(email: string): boolean {
  const key = normalizeEmail(email)
  return Boolean(readMockCreds()[key])
}
