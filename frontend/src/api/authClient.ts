import type { ApiResponse } from './types'

/** 비우면 상대 경로 `/api` → Vite 프록시 → 백엔드 */
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? ''

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

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  let body: unknown
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    throw new ApiError(text?.slice(0, 200) || '서버 응답을 해석할 수 없습니다.', {
      status: res.status,
    })
  }

  if (typeof body !== 'object' || body === null || !('success' in body)) {
    throw new ApiError(`요청 실패 (${res.status})`, { status: res.status })
  }

  const api = body as ApiResponse<T>
  if (!api.success) {
    const msg = api.error?.message ?? `요청 실패 (${res.status})`
    throw new ApiError(msg, { code: api.error?.code, status: res.status })
  }

  return api.data as T
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

  const res = await fetch(`${API_V1_BASE}${rel}`, { ...rest, headers })
  return parseJson<T>(res)
}

/** `/api/v1/auth/*` */
export async function authFetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const rel = path.startsWith('/') ? path : `/${path}`
  return apiV1Fetch<T>(`/auth${rel}`, init)
}
