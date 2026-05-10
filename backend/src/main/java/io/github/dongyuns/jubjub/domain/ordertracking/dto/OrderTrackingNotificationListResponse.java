package io.github.dongyuns.jubjub.domain.ordertracking.dto;

import java.util.List;

public record OrderTrackingNotificationListResponse(
        long unreadCount,
        List<OrderTrackingNotificationItemResponse> notifications
) {
}
