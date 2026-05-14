package io.github.dongyuns.jubjub.domain.notification.dto;

import java.time.LocalDateTime;

public record NotificationItemResponse(
        NotificationType type,
        Long notificationId,
        Long orderId,
        Long storeId,
        String title,
        String message,
        boolean read,
        LocalDateTime createdAt
) {
}
