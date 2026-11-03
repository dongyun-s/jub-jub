import type { UnifiedNotificationItem } from '../api/notifications'
import type { ReviewWritePayload } from '../api/reviews'
import { fetchStoreDetail } from '../api/store'
import { resolveOrderById } from './orderResolve'

export type NotificationNavigateTarget =
  | { type: 'orders' }
  | { type: 'orderStatus'; orderId: number }
  | { type: 'reviewWrite'; payload: ReviewWritePayload }
  | { type: 'coupon'; highlightExpiringSoon?: boolean }

function looksCompletedOrderNotice(item: UnifiedNotificationItem): boolean {
  const text = `${item.title} ${item.body}`.toLowerCase()
  return (
    text.includes('픽업 완료') ||
    text.includes('픽업완료') ||
    text.includes('주문 완료') ||
    text.includes('완료되었') ||
    text.includes('거절') ||
    text.includes('환불') ||
    text.includes('completed') ||
    text.includes('refund')
  )
}

/** 알림 타입·필드에 따른 이동 대상 (읽음 처리 후 호출) */
export async function resolveNotificationTarget(
  item: UnifiedNotificationItem,
): Promise<NotificationNavigateTarget> {
  switch (item.type) {
    case 'ORDER_TRACKING': {
      if (item.orderId == null || item.orderId <= 0) return { type: 'orders' }
      if (looksCompletedOrderNotice(item)) return { type: 'orders' }
      try {
        const order = await resolveOrderById(item.orderId)
        if (
          order?.pickupCompleted ||
          order?.orderStatus === 'COMPLETED' ||
          order?.orderStatus === 'REFUNDED'
        ) {
          return { type: 'orders' }
        }
      } catch {
        /* 진행 중으로 가정하고 현황으로 */
      }
      return { type: 'orderStatus', orderId: item.orderId }
    }

    case 'REVIEW_REQUEST': {
      if (item.orderId != null && item.storeId != null && item.orderId > 0 && item.storeId > 0) {
        let storeName = '매장'
        try {
          const detail = await fetchStoreDetail(item.storeId)
          storeName = detail.name
        } catch {
          /* fallback name */
        }
        return {
          type: 'reviewWrite',
          payload: {
            orderId: item.orderId,
            storeId: item.storeId,
            storeName,
          },
        }
      }
      return { type: 'orders' }
    }

    case 'COUPON_ISSUED':
      return { type: 'coupon' }
    case 'COUPON_EXPIRING':
      return { type: 'coupon', highlightExpiringSoon: true }

    default:
      return { type: 'orders' }
  }
}

export function notificationNavigateHint(item: UnifiedNotificationItem): string | null {
  switch (item.type) {
    case 'ORDER_TRACKING':
      if (!item.orderId) return '주문 내역 보기'
      return looksCompletedOrderNotice(item) ? '주문 내역 보기' : '주문 현황 보기'
    case 'REVIEW_REQUEST':
      return item.orderId && item.storeId ? '리뷰 작성하기' : '주문 내역 보기'
    case 'COUPON_ISSUED':
    case 'COUPON_EXPIRING':
      return '내 쿠폰 보기'
    default:
      return null
  }
}
