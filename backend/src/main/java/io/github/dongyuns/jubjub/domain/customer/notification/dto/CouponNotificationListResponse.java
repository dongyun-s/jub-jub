package io.github.dongyuns.jubjub.domain.customer.notification.dto;

import java.util.List;

public record CouponNotificationListResponse(
        long unreadCount,
        List<CouponNotificationItemResponse> notifications
) {
}
