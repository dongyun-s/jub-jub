package io.github.dongyuns.jubjub.domain.customer.ordertracking.dto;

import java.util.List;

public record OrderTrackingNotificationListResponse(
        long unreadCount,
        List<OrderTrackingNotificationItemResponse> notifications
) {
}
