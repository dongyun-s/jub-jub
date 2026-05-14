package io.github.dongyuns.jubjub.domain.reviewnotification.dto;

import io.github.dongyuns.jubjub.domain.reviewnotification.entity.ReviewNotification;
import java.time.LocalDateTime;

public record ReviewNotificationItemResponse(
        Long notificationId,
        Long orderId,
        Long storeId,
        String title,
        String message,
        boolean read,
        LocalDateTime createdAt
) {
    public static ReviewNotificationItemResponse from(ReviewNotification notification) {
        return new ReviewNotificationItemResponse(
                notification.getId(),
                notification.getOrderId(),
                notification.getStoreId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
