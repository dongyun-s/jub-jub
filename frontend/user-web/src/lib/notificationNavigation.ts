import type { UnifiedNotificationItem } from '../api/notifications'
import type { ReviewWritePayload } from '../api/reviews'
import { fetchStoreDetail } from '../api/store'

export type NotificationNavigateTarget =
  | { type: 'orders' }
  | { type: 'orderStatus'; orderId: number }
  | { type: 'reviewWrite'; payload: ReviewWritePayload }
  | { type: 'mypage' }

/** 알림 타입·필드에 따른 이동 대상 (읽음 처리 후 호출) */
export async function resolveNotificationTarget(
  item: UnifiedNotificationItem,
): Promise<NotificationNavigateTarget> {
  switch (item.type) {
    case 'ORDER_TRACKING':
      if (item.orderId != null && item.orderId > 0) {
        return { type: 'orderStatus', orderId: item.orderId }
      }
      return { type: 'orders' }

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
    case 'COUPON_EXPIRING':
      return { type: 'mypage' }

    default:
      return { type: 'orders' }
  }
}

export function notificationNavigateHint(item: UnifiedNotificationItem): string | null {
  switch (item.type) {
    case 'ORDER_TRACKING':
      return item.orderId ? '주문 현황 보기' : '주문 내역 보기'
    case 'REVIEW_REQUEST':
      return item.orderId && item.storeId ? '리뷰 작성하기' : '주문 내역 보기'
    case 'COUPON_ISSUED':
    case 'COUPON_EXPIRING':
      return '내 쿠폰 보기'
    default:
      return null
  }
}
