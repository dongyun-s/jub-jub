import type { ApiResponse } from './types'

/**
 * 비우거나 공백만 있으면 상대 경로(`/api` …) → Vite dev 프록시 → 백엔드 (CORS 없음).
 * 전체 URL(https://ngrok…)을 넣으면 브라우저가 다른 출처로 직접 요청하므로 백엔드 CORS 설정이 필요합니다.
 */
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.trim() ?? ''

function isNgrokBaseUrl(url: string): boolean {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    return u.hostname.endsWith('ngrok-free.dev') || u.hostname.endsWith('ngrok.io')
  } catch {
    return /ngrok-free\.dev|ngrok\.io/i.test(url)
  }
}

/** Vite 프록시로 ngrok 백엔드를 쓸 때도 브라우저 요청에 경고 스킵 헤더를 붙인다 */
const DEV_PROXY_TARGET = (import.meta.env.VITE_DEV_PROXY_TARGET as string | undefined)?.trim() ?? ''
const NGROK_SKIP_WARN = isNgrokBaseUrl(API_BASE) || isNgrokBaseUrl(DEV_PROXY_TARGET)

/** 통합 API 베이스 `…/api/v1` */
export const API_V1_BASE = `${API_BASE}/api/v1`

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

/** HTTP 상태 번호는 사용자에게 붙이지 않고, 서버 message가 없을 때만 쓰는 안내 */
function friendlyFallbackMessage(status: number): string {
  if (status >= 500) return '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
  if (status === 401 || status === 403) return '접근 권한이 없거나 로그인이 필요합니다.'
  if (status === 404) return '요청한 정보를 찾을 수 없습니다.'
  if (status === 408 || status === 504) return '응답이 지연되었습니다. 잠시 후 다시 시도해 주세요.'
  if (status === 0) return '네트워크 연결을 확인해 주세요.'
  return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

/** Spring `GlobalExceptionHandler` 의 ApiErrorResponse: { code, message, timestamp } */
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
    /**
     * 일부 엔드포인트(혹은 구버전 서버)가 200 OK + text/plain(성공 메시지)로 응답할 수 있음.
     * - 이 경우 JSON 파싱 대신 원문 텍스트를 그대로 반환해 UI를 깨지지 않게 한다.
     * - 2xx가 아닌 경우는 기존대로 친절 메시지로 처리.
     */
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
    /**
     * `/api/v1/carts` 처럼 성공 응답을 text/plain 으로 내려주는 경우가 있음.
     * - 2xx: 원문 텍스트 그대로 반환
     * - 비정상: 기존 fallback 메시지
     */
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

  return body as T
}

export type ApiFetchInit = RequestInit & { skipAuth?: boolean }

/** @deprecated `ApiFetchInit` 사용 */
export type AuthFetchInit = ApiFetchInit

export async function apiV1Fetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const { skipAuth, headers: initHeaders, ...rest } = init
  const headers = new Headers(initHeaders)
  const rel = path.startsWith('/') ? path : `/${path}`

  if (!headers.has('Content-Type') && rest.body != null) {
    headers.set('Content-Type', 'application/json')
  }
  if (!skipAuth) {
    const token =
      typeof window !== 'undefined' ? window.localStorage.getItem('jubjub_access_token') : null
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }
  /** ngrok 무료: 브라우저 fetch가 중간 HTML에 막히며 ERR_FAILED(200) 나는 경우 방지 */
  if (NGROK_SKIP_WARN && !headers.has('ngrok-skip-browser-warning')) {
    headers.set('ngrok-skip-browser-warning', 'true')
  }

  const res = await fetch(`${API_V1_BASE}${rel}`, { ...rest, headers })
  return parseJson<T>(res)
}

/**
 * `/api/v1/*` 이지만 ApiResponse 래핑이 아닌 엔드포인트용.
 * (예: origin/develop 기준 Cart API는 ResponseEntity<String>/CartListResponse 형태)
 */
export async function apiV1FetchPlain<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const { skipAuth, headers: initHeaders, ...rest } = init
  const headers = new Headers(initHeaders)
  const rel = path.startsWith('/') ? path : `/${path}`

  if (!headers.has('Content-Type') && rest.body != null) {
    headers.set('Content-Type', 'application/json')
  }
  if (!skipAuth) {
    const token =
      typeof window !== 'undefined' ? window.localStorage.getItem('jubjub_access_token') : null
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }
  if (NGROK_SKIP_WARN && !headers.has('ngrok-skip-browser-warning')) {
    headers.set('ngrok-skip-browser-warning', 'true')
  }

  const res = await fetch(`${API_V1_BASE}${rel}`, { ...rest, headers })
  return parsePlainJson<T>(res)
}

/**
 * `/orders`, `/payments` 처럼 `/api/v1` prefix가 아닌 API 호출용.
 * - 응답은 ApiResponse 래핑이 아닐 수 있어 plain JSON으로 파싱
 */
export async function apiFetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const { skipAuth, headers: initHeaders, ...rest } = init
  const headers = new Headers(initHeaders)
  const rel = path.startsWith('/') ? path : `/${path}`

  if (!headers.has('Content-Type') && rest.body != null) {
    headers.set('Content-Type', 'application/json')
  }
  if (!skipAuth) {
    const token =
      typeof window !== 'undefined' ? window.localStorage.getItem('jubjub_access_token') : null
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }
  if (NGROK_SKIP_WARN && !headers.has('ngrok-skip-browser-warning')) {
    headers.set('ngrok-skip-browser-warning', 'true')
  }

  const res = await fetch(`${API_BASE}${rel}`, { ...rest, headers })
  return parsePlainJson<T>(res)
}

/** `/api/v1/auth/*` */
export async function authFetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const rel = path.startsWith('/') ? path : `/${path}`
  return apiV1Fetch<T>(`/auth${rel}`, init)
}
