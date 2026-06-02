import type { ApiResponse } from './types'

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.trim() ?? ''

function isNgrokBaseUrl(url: string): boolean {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    return u.hostname.endsWith('ngrok-free.dev') || u.hostname.endsWith('ngrok.io')
  } catch {
    return /ngrok-free\.dev|ngrok\.io/i.test(url)
  }
}

const DEV_PROXY_TARGET = (import.meta.env.VITE_DEV_PROXY_TARGET as string | undefined)?.trim() ?? ''
const NGROK_SKIP_WARN = isNgrokBaseUrl(API_BASE) || isNgrokBaseUrl(DEV_PROXY_TARGET)

export const API_V1_BASE = `${API_BASE}/api/v1`

/** 개발용: .env VITE_OWNER_DEV_TOKEN 또는 user-web과 동일 localStorage 키 */
export function getOwnerAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  const dev = (import.meta.env.VITE_OWNER_DEV_TOKEN as string | undefined)?.trim()
  if (dev) return dev
  return window.localStorage.getItem('jubjub_access_token')
}

export class ApiError extends Error {
  readonly code?: string
  readonly status: number

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message)
    this.name = 'ApiError'
    this.code = options?.code
    this.status = options?.status ?? 0
  }
}

function friendlyFallbackMessage(status: number): string {
  if (status >= 500) return '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
  if (status === 401 || status === 403) return '접근 권한이 없거나 로그인이 필요합니다.'
  if (status === 404) return '요청한 정보를 찾을 수 없습니다.'
  if (status === 408 || status === 504) return '응답이 지연되었습니다. 잠시 후 다시 시도해 주세요.'
  if (status === 0) return '네트워크 연결을 확인해 주세요.'
  return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

function tryApiErrorResponse(body: unknown): { code: string; message: string } | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null
  const o = body as Record<string, unknown>
  if ('success' in o) return null
  if (typeof o.message !== 'string' || typeof o.code !== 'string') return null
  return { code: o.code, message: o.message }
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  let body: unknown
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    if (res.ok) return text as unknown as T
    throw new ApiError(friendlyFallbackMessage(res.status), { status: res.status })
  }

  if (!res.ok) {
    const errBody = tryApiErrorResponse(body)
    if (errBody?.message) {
      throw new ApiError(errBody.message, { code: errBody.code, status: res.status })
    }
    if (typeof body === 'object' && body !== null && 'success' in body) {
      const apiErr = body as ApiResponse<unknown>
      if (apiErr.success === false && apiErr.error?.message) {
        throw new ApiError(apiErr.error.message, {
          code: apiErr.error.code,
          status: res.status,
        })
      }
    }
    throw new ApiError(friendlyFallbackMessage(res.status), { status: res.status })
  }

  if (typeof body !== 'object' || body === null || !('success' in body)) {
    throw new ApiError('서버 응답 형식이 올바르지 않습니다.', { status: res.status })
  }

  const api = body as ApiResponse<T>
  if (!api.success) {
    const msg = api.error?.message?.trim() || friendlyFallbackMessage(res.status)
    throw new ApiError(msg, { code: api.error?.code, status: res.status })
  }

  return api.data as T
}

async function parsePlainJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  let body: unknown
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    if (res.ok) return text as unknown as T
    throw new ApiError(friendlyFallbackMessage(res.status), { status: res.status })
  }

  if (!res.ok) {
    const errBody = tryApiErrorResponse(body)
    if (errBody?.message) {
      throw new ApiError(errBody.message, { code: errBody.code, status: res.status })
    }
    throw new ApiError(friendlyFallbackMessage(res.status), { status: res.status })
  }

  return body as T
}

export type ApiFetchInit = RequestInit & { skipAuth?: boolean }

function attachAuthHeaders(headers: Headers, skipAuth?: boolean) {
  if (!skipAuth) {
    const token = getOwnerAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }
  if (NGROK_SKIP_WARN && !headers.has('ngrok-skip-browser-warning')) {
    headers.set('ngrok-skip-browser-warning', 'true')
  }
}

export async function apiV1Fetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const { skipAuth, headers: initHeaders, ...rest } = init
  const headers = new Headers(initHeaders)
  const rel = path.startsWith('/') ? path : `/${path}`

  if (!headers.has('Content-Type') && rest.body != null) {
    headers.set('Content-Type', 'application/json')
  }
  attachAuthHeaders(headers, skipAuth)

  const res = await fetch(`${API_V1_BASE}${rel}`, { ...rest, headers })
  return parseJson<T>(res)
}

export async function apiV1FetchPlain<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const { skipAuth, headers: initHeaders, ...rest } = init
  const headers = new Headers(initHeaders)
  const rel = path.startsWith('/') ? path : `/${path}`

  if (!headers.has('Content-Type') && rest.body != null) {
    headers.set('Content-Type', 'application/json')
  }
  attachAuthHeaders(headers, skipAuth)

  const res = await fetch(`${API_V1_BASE}${rel}`, { ...rest, headers })
  return parsePlainJson<T>(res)
}

export async function apiFetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const { skipAuth, headers: initHeaders, ...rest } = init
  const headers = new Headers(initHeaders)
  const rel = path.startsWith('/') ? path : `/${path}`

  if (!headers.has('Content-Type') && rest.body != null) {
    headers.set('Content-Type', 'application/json')
  }
  attachAuthHeaders(headers, skipAuth)

  const res = await fetch(`${API_BASE}${rel}`, { ...rest, headers })
  return parsePlainJson<T>(res)
}
