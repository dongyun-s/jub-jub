package io.github.dongyuns.jubjub.domain.customer.notification.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.customer.notification.dto.CouponNotificationItemResponse;
import io.github.dongyuns.jubjub.domain.customer.notification.dto.CouponNotificationListResponse;
import io.github.dongyuns.jubjub.domain.core.notification.service.CouponNotificationService;
import io.github.dongyuns.jubjub.domain.customer.notification.dto.NotificationItemResponse;
import io.github.dongyuns.jubjub.domain.customer.notification.dto.NotificationListResponse;
import io.github.dongyuns.jubjub.domain.customer.notification.dto.NotificationType;
import io.github.dongyuns.jubjub.domain.customer.ordertracking.dto.OrderTrackingNotificationItemResponse;
import io.github.dongyuns.jubjub.domain.customer.ordertracking.dto.OrderTrackingNotificationListResponse;
import io.github.dongyuns.jubjub.domain.core.ordertracking.service.OrderTrackingNotificationService;
import io.github.dongyuns.jubjub.domain.customer.notification.dto.ReviewNotificationItemResponse;
import io.github.dongyuns.jubjub.domain.customer.notification.dto.ReviewNotificationListResponse;
import io.github.dongyuns.jubjub.domain.core.notification.service.ReviewNotificationService;
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
    private final CouponNotificationService couponNotificationService;

    @Transactional(readOnly = true)
    public NotificationListResponse getMyNotifications(String accountEmail) {
        OrderTrackingNotificationListResponse orderTrackingNotifications =
                orderTrackingNotificationService.getMyNotifications(accountEmail);
        ReviewNotificationListResponse reviewNotifications =
                reviewNotificationService.getMyNotifications(accountEmail);
        CouponNotificationListResponse couponNotifications =
                couponNotificationService.getMyNotifications(accountEmail);

        List<NotificationItemResponse> merged = orderTrackingNotifications.notifications().stream()
                .map(this::fromOrderTracking)
                .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));

        merged.addAll(
                reviewNotifications.notifications().stream()
                        .map(this::fromReviewRequest)
                        .toList()
        );
        merged.addAll(
                couponNotifications.notifications().stream()
                        .map(this::fromCouponIssued)
                        .toList()
        );

        merged.sort(Comparator.comparing(NotificationItemResponse::createdAt).reversed());

        return new NotificationListResponse(
                orderTrackingNotifications.unreadCount()
                        + reviewNotifications.unreadCount()
                        + couponNotifications.unreadCount(),
                merged
        );
    }

    @Transactional
    public void markAllAsRead(String accountEmail) {
        orderTrackingNotificationService.markAllAsRead(accountEmail);
        reviewNotificationService.markAllAsRead(accountEmail);
        couponNotificationService.markAllAsRead(accountEmail);
    }

    @Transactional
    public void markAsRead(String accountEmail, NotificationType type, Long notificationId) {
        switch (type) {
            case ORDER_TRACKING -> orderTrackingNotificationService.markAsRead(accountEmail, notificationId);
            case REVIEW_REQUEST -> reviewNotificationService.markAsRead(accountEmail, notificationId);
            case COUPON_ISSUED -> couponNotificationService.markAsRead(accountEmail, notificationId);
            default -> throw new BusinessException("UNSUPPORTED_NOTIFICATION_TYPE", "지원하지 않는 알림 타입입니다.", HttpStatus.BAD_REQUEST);
        }
    }

    @Transactional
    public void markAsRead(String accountEmail, Long notificationId) {
        boolean updated = orderTrackingNotificationService.markAsReadIfExists(accountEmail, notificationId);
        updated = reviewNotificationService.markAsReadIfExists(accountEmail, notificationId) || updated;
        updated = couponNotificationService.markAsReadIfExists(accountEmail, notificationId) || updated;

        if (!updated) {
            throw new BusinessException("NOTIFICATION_NOT_FOUND", "알림을 찾을 수 없습니다.", HttpStatus.NOT_FOUND);
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

    private NotificationItemResponse fromCouponIssued(CouponNotificationItemResponse notification) {
        return new NotificationItemResponse(
                NotificationType.COUPON_ISSUED,
                notification.notificationId(),
                null,
                null,
                notification.title(),
                notification.message(),
                notification.read(),
                notification.createdAt()
        );
    }
}
