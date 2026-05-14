package io.github.dongyuns.jubjub.domain.notification.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.notification.dto.NotificationItemResponse;
import io.github.dongyuns.jubjub.domain.notification.dto.NotificationListResponse;
import io.github.dongyuns.jubjub.domain.notification.dto.NotificationType;
import io.github.dongyuns.jubjub.domain.ordertracking.dto.OrderTrackingNotificationItemResponse;
import io.github.dongyuns.jubjub.domain.ordertracking.dto.OrderTrackingNotificationListResponse;
import io.github.dongyuns.jubjub.domain.ordertracking.service.OrderTrackingNotificationService;
import io.github.dongyuns.jubjub.domain.reviewnotification.dto.ReviewNotificationItemResponse;
import io.github.dongyuns.jubjub.domain.reviewnotification.dto.ReviewNotificationListResponse;
import io.github.dongyuns.jubjub.domain.reviewnotification.service.ReviewNotificationService;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final OrderTrackingNotificationService orderTrackingNotificationService;
    private final ReviewNotificationService reviewNotificationService;

    @Transactional(readOnly = true)
    public NotificationListResponse getMyNotifications(String accountEmail) {
        OrderTrackingNotificationListResponse orderTrackingNotifications =
                orderTrackingNotificationService.getMyNotifications(accountEmail);
        ReviewNotificationListResponse reviewNotifications =
                reviewNotificationService.getMyNotifications(accountEmail);

        List<NotificationItemResponse> merged = orderTrackingNotifications.notifications().stream()
                .map(this::fromOrderTracking)
                .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));

        merged.addAll(
                reviewNotifications.notifications().stream()
                        .map(this::fromReviewRequest)
                        .toList()
        );

        merged.sort(Comparator.comparing(NotificationItemResponse::createdAt).reversed());

        return new NotificationListResponse(
                orderTrackingNotifications.unreadCount() + reviewNotifications.unreadCount(),
                merged
        );
    }

    @Transactional
    public void markAllAsRead(String accountEmail) {
        orderTrackingNotificationService.markAllAsRead(accountEmail);
        reviewNotificationService.markAllAsRead(accountEmail);
    }

    @Transactional
    public void markAsRead(String accountEmail, NotificationType type, Long notificationId) {
        switch (type) {
            case ORDER_TRACKING -> orderTrackingNotificationService.markAsRead(accountEmail, notificationId);
            case REVIEW_REQUEST -> reviewNotificationService.markAsRead(accountEmail, notificationId);
            default -> throw new BusinessException("UNSUPPORTED_NOTIFICATION_TYPE", "지원하지 않는 알림 타입입니다.", HttpStatus.BAD_REQUEST);
        }
    }

    private NotificationItemResponse fromOrderTracking(OrderTrackingNotificationItemResponse notification) {
        return new NotificationItemResponse(
                NotificationType.ORDER_TRACKING,
                notification.notificationId(),
                notification.orderId(),
                null,
                notification.title(),
                notification.message(),
                notification.read(),
                notification.createdAt()
        );
    }

    private NotificationItemResponse fromReviewRequest(ReviewNotificationItemResponse notification) {
        return new NotificationItemResponse(
                NotificationType.REVIEW_REQUEST,
                notification.notificationId(),
                notification.orderId(),
                notification.storeId(),
                notification.title(),
                notification.message(),
                notification.read(),
                notification.createdAt()
        );
    }
}
