package io.github.dongyuns.jubjub.domain.customer.notification.dto;

import java.util.List;

public record NotificationListResponse(
        long unreadCount,
        List<NotificationItemResponse> notifications
) {
}
