import type { UnifiedNotificationsPayload } from '../../api/notifications'

/** 백엔드 쿠폰 알림 타입 반영 전 목 데이터 */
export function getMockUnifiedNotifications(): UnifiedNotificationsPayload {
  const notifications = [
    {
      id: 'ORDER_TRACKING-1',
      type: 'ORDER_TRACKING' as const,
      notificationId: 1,
      orderId: 101,
      title: '픽업 준비 완료',
      body: '주문하신 메뉴를 매장에서 픽업할 수 있어요.',
      createdAt: new Date(Date.now() - 3600_000).toISOString(),
      read: false,
    },
    {
      id: 'REVIEW_REQUEST-2',
      type: 'REVIEW_REQUEST' as const,
      notificationId: 2,
      orderId: 99,
      storeId: 1,
      title: '리뷰를 남겨주세요',
      body: '픽업이 완료된 주문에 대한 리뷰를 작성해 주세요.',
      createdAt: new Date(Date.now() - 86_400_000).toISOString(),
      read: false,
    },
    {
      id: 'COUPON_ISSUED-3',
      type: 'COUPON_ISSUED' as const,
      notificationId: 3,
      couponId: 501,
      couponAmount: 1000,
      title: '티어 승급 쿠폰 지급',
      body: '등급 승급 기념 1,000원 쿠폰이 쿠폰함에 추가되었습니다.',
      createdAt: new Date(Date.now() - 172_800_000).toISOString(),
      read: true,
    },
    {
      id: 'COUPON_EXPIRING-4',
      type: 'COUPON_EXPIRING' as const,
      notificationId: 4,
      couponId: 402,
      couponAmount: 1000,
      title: '쿠폰 만료 임박',
      body: '보유 쿠폰 1,000원이 3일 후 만료됩니다.',
      createdAt: new Date(Date.now() - 259_200_000).toISOString(),
      read: false,
    },
  ]

  return {
    unreadCount: notifications.filter((n) => !n.read).length,
    notifications,
  }
}
