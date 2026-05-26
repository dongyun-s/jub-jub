package io.github.dongyuns.jubjub.domain.couponnotification.dto;

import io.github.dongyuns.jubjub.domain.couponnotification.entity.CouponNotification;
import java.time.LocalDateTime;

public record CouponNotificationItemResponse(
        Long notificationId,
        Long memberCouponId,
        Long couponPolicyId,
        String title,
        String message,
        boolean read,
        LocalDateTime createdAt
) {
    public static CouponNotificationItemResponse from(CouponNotification notification) {
        return new CouponNotificationItemResponse(
                notification.getId(),
                notification.getMemberCouponId(),
                notification.getCouponPolicyId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
