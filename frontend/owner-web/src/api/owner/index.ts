/**
 * Owner Web → /api/v1/owner/* 클라이언트
 * BE domain/owner (dashboard, order, menu, review, store) 연동용.
 * 화면 mock은 유지하고, 실연동 시 이 모듈을 호출하면 됩니다.
 */
export { OWNER_API } from './paths'

export * from './dashboard'
export * from './orders'
export * from './menu'
export * from './review'
export * from './store'
