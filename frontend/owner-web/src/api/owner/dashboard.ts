/**
 * GET /api/v1/owner/dashboard
 * BE 필드명 변형(todaySales / todaySalesAmount 등)을 정규화한다.
 */
import { apiV1Fetch } from '../authClient'
import { OWNER_API } from './paths'

export type OwnerDashboardWeeklySale = {
  date: string
  salesAmount: number
}

export type OwnerDashboardBestMenu = {
  menuId: number
  menuName: string
  orderQuantity: number
  salesAmount: number
}

export type OwnerDashboardReview = {
  reviewId: number
  overallRating: number
  content: string
  createdAt?: string
}

export type OwnerDashboardDto = {
  todaySales: number
  todayOrderCount: number
  activeOrderCount: number
  weeklySales: OwnerDashboardWeeklySale[]
  bestMenus: OwnerDashboardBestMenu[]
  averageRating: number
  totalReviewCount: number
  recentReviews: OwnerDashboardReview[]
  storeStatus: 'OPEN' | 'PAUSED' | 'CLOSED' | string
  storeName?: string
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return null
  return v as Record<string, unknown>
}

function normalizeWeekly(raw: unknown): OwnerDashboardWeeklySale[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((row) => {
      const p = asRecord(row)
      if (!p) return null
      const date = String(p.date ?? p.saleDate ?? p.day ?? '').trim()
      if (!date) return null
      return {
        date,
        salesAmount: num(p.salesAmount ?? p.sales_amount ?? p.amount ?? p.totalSales ?? p.total_sales),
      }
    })
    .filter(Boolean) as OwnerDashboardWeeklySale[]
}

function normalizeBestMenus(raw: unknown): OwnerDashboardBestMenu[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((row) => {
      const p = asRecord(row)
      if (!p) return null
      const menuName = String(p.menuName ?? p.menu_name ?? p.name ?? '').trim()
      if (!menuName) return null
      return {
        menuId: num(p.menuId ?? p.menu_id),
        menuName,
        orderQuantity: num(p.orderQuantity ?? p.order_quantity ?? p.orderCount ?? p.order_count ?? p.orders),
        salesAmount: num(p.salesAmount ?? p.sales_amount ?? p.amount ?? p.price ?? p.totalSales),
      }
    })
    .filter(Boolean) as OwnerDashboardBestMenu[]
}

function normalizeReviews(raw: unknown): OwnerDashboardReview[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((row) => {
      const p = asRecord(row)
      if (!p) return null
      const reviewId = num(p.reviewId ?? p.review_id ?? p.id)
      if (!reviewId) return null
      return {
        reviewId,
        overallRating: num(p.overallRating ?? p.overall_rating ?? p.rating, 0),
        content: String(p.content ?? p.body ?? '').trim(),
        createdAt:
          p.createdAt != null
            ? String(p.createdAt)
            : p.created_at != null
              ? String(p.created_at)
              : undefined,
      }
    })
    .filter(Boolean) as OwnerDashboardReview[]
}

export function normalizeOwnerDashboard(raw: unknown): OwnerDashboardDto {
  const p = asRecord(raw) ?? {}
  return {
    todaySales: num(p.todaySales ?? p.today_sales ?? p.todaySalesAmount ?? p.today_sales_amount),
    todayOrderCount: num(p.todayOrderCount ?? p.today_order_count ?? p.orderCount ?? p.order_count),
    activeOrderCount: num(
      p.activeOrderCount ?? p.active_order_count ?? p.inProgressOrderCount ?? p.in_progress_order_count,
    ),
    weeklySales: normalizeWeekly(p.weeklySales ?? p.weekly_sales),
    bestMenus: normalizeBestMenus(p.bestMenus ?? p.best_menus),
    averageRating: num(p.averageRating ?? p.average_rating ?? p.avgRating ?? p.avg_rating),
    totalReviewCount: num(p.totalReviewCount ?? p.total_review_count ?? p.reviewCount ?? p.review_count),
    recentReviews: normalizeReviews(p.recentReviews ?? p.recent_reviews),
    storeStatus: String(p.storeStatus ?? p.store_status ?? p.salesStatus ?? p.sales_status ?? 'OPEN'),
    storeName: String(p.storeName ?? p.store_name ?? '').trim() || undefined,
  }
}

export async function fetchOwnerDashboard() {
  const raw = await apiV1Fetch<unknown>(OWNER_API.dashboard, { method: 'GET' })
  return normalizeOwnerDashboard(raw)
}
