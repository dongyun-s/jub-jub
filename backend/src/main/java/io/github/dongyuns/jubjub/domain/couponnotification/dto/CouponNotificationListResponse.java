package io.github.dongyuns.jubjub.domain.couponnotification.dto;

import java.util.List;

public record CouponNotificationListResponse(
        long unreadCount,
        List<CouponNotificationItemResponse> notifications
) {
}
