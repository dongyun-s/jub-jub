/**
 * 백엔드 ApiResponse<T> 규격과 동일
 */
export interface ApiErrorBody {
  code?: string
  message?: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: ApiErrorBody | null
}
