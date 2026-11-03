package io.github.dongyuns.jubjub.domain.customer.ordertracking.controller;

import io.github.dongyuns.jubjub.domain.customer.ordertracking.dto.OrderTrackingNotificationListResponse;
import io.github.dongyuns.jubjub.domain.customer.ordertracking.dto.OrderTrackingResponse;
import io.github.dongyuns.jubjub.domain.customer.ordertracking.dto.OrderDepartureRecommendationResponse;
import io.github.dongyuns.jubjub.domain.customer.ordertracking.service.OrderDepartureRecommendationService;
import io.github.dongyuns.jubjub.domain.core.ordertracking.service.OrderTrackingNotificationService;
import io.github.dongyuns.jubjub.domain.core.ordertracking.service.OrderTrackingQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/order-tracking")
@RequiredArgsConstructor
public class OrderTrackingController {

    private final OrderTrackingQueryService orderTrackingQueryService;
    private final OrderTrackingNotificationService orderTrackingNotificationService;
    private final OrderDepartureRecommendationService orderDepartureRecommendationService;

    @GetMapping("/{orderId}")
    public OrderTrackingResponse getMyTracking(Authentication authentication, @PathVariable Long orderId) {
        return orderTrackingQueryService.getMyTracking(authentication != null ? authentication.getName() : null, orderId);
    }

    @GetMapping("/{orderId}/departure-recommendation")
    public OrderDepartureRecommendationResponse getDepartureRecommendation(
            Authentication authentication,
            @PathVariable Long orderId,
            @RequestParam double userLat,
            @RequestParam double userLng
    ) {
        return orderDepartureRecommendationService.recommend(
                authentication != null ? authentication.getName() : null, orderId, userLat, userLng
        );
    }

    @GetMapping("/notifications")
    public OrderTrackingNotificationListResponse getMyNotifications(Authentication authentication) {
        return orderTrackingNotificationService.getMyNotifications(authentication != null ? authentication.getName() : null);
    }

    @PostMapping("/notifications/read-all")
    public void markAllNotificationsAsRead(Authentication authentication) {
        orderTrackingNotificationService.markAllAsRead(authentication != null ? authentication.getName() : null);
    }

    @PostMapping("/notifications/{notificationId}/read")
    public void markNotificationAsRead(Authentication authentication, @PathVariable Long notificationId) {
        orderTrackingNotificationService.markAsRead(authentication != null ? authentication.getName() : null, notificationId);
    }
}
