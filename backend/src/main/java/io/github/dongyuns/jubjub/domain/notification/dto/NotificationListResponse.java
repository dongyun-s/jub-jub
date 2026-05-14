package io.github.dongyuns.jubjub.domain.notification.dto;

import java.util.List;

public record NotificationListResponse(
        long unreadCount,
        List<NotificationItemResponse> notifications
) {
}
