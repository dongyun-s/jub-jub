package io.github.dongyuns.jubjub.domain.ordertracking.dto;

import io.github.dongyuns.jubjub.domain.ordertracking.entity.OrderTrackingNotification;
import java.time.LocalDateTime;

public record OrderTrackingNotificationItemResponse(
        Long notificationId,
        Long orderId,
        String title,
        String message,
        boolean read,
        LocalDateTime createdAt
) {
    public static OrderTrackingNotificationItemResponse from(OrderTrackingNotification notification) {
        return new OrderTrackingNotificationItemResponse(
                notification.getId(),
                notification.getOrderId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
