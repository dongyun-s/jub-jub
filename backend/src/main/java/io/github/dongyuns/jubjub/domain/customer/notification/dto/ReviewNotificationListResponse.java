package io.github.dongyuns.jubjub.domain.customer.notification.dto;

import java.util.List;

public record ReviewNotificationListResponse(
        long unreadCount,
        List<ReviewNotificationItemResponse> notifications
) {
}
