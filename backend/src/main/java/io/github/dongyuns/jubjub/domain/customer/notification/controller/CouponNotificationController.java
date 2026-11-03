package io.github.dongyuns.jubjub.domain.customer.notification.controller;

import io.github.dongyuns.jubjub.domain.customer.notification.dto.CouponNotificationListResponse;
import io.github.dongyuns.jubjub.domain.core.notification.service.CouponNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/coupon-notifications")
@RequiredArgsConstructor
public class CouponNotificationController {

    private final CouponNotificationService couponNotificationService;

    @GetMapping
    public CouponNotificationListResponse getMyNotifications(Authentication authentication) {
        return couponNotificationService.getMyNotifications(authentication != null ? authentication.getName() : null);
    }

    @PostMapping("/read-all")
    public void markAllAsRead(Authentication authentication) {
        couponNotificationService.markAllAsRead(authentication != null ? authentication.getName() : null);
    }

    @PostMapping("/{notificationId}/read")
    public void markAsRead(Authentication authentication, @PathVariable Long notificationId) {
        couponNotificationService.markAsRead(authentication != null ? authentication.getName() : null, notificationId);
    }
}
