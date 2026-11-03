/**
 * Owner Web API 경로 규약 (백엔드 domain/owner 기준)
 * Base: /api/v1/owner/...
 */
export const OWNER_API = {
  auth: {
    signup: '/owner/auth/signup',
    register: '/owner/auth/register',
  },
  dashboard: '/owner/dashboard',
  orders: '/owner/orders',
  menu: '/owner/menu',
  review: '/owner/review',
  store: '/owner/store',
} as const
