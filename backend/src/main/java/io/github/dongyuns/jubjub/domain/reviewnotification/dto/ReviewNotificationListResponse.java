package io.github.dongyuns.jubjub.domain.reviewnotification.dto;

import java.util.List;

public record ReviewNotificationListResponse(
        long unreadCount,
        List<ReviewNotificationItemResponse> notifications
) {
}
