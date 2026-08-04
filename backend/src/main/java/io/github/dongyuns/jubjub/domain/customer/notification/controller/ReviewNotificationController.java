package io.github.dongyuns.jubjub.domain.customer.notification.controller;

import io.github.dongyuns.jubjub.domain.customer.notification.dto.ReviewNotificationListResponse;
import io.github.dongyuns.jubjub.domain.core.notification.service.ReviewNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/review-notifications")
@RequiredArgsConstructor
public class ReviewNotificationController {

    private final ReviewNotificationService reviewNotificationService;

    @GetMapping
    public ReviewNotificationListResponse getMyNotifications(Authentication authentication) {
        return reviewNotificationService.getMyNotifications(authentication != null ? authentication.getName() : null);
    }

    @PostMapping("/read-all")
    public void markAllAsRead(Authentication authentication) {
        reviewNotificationService.markAllAsRead(authentication != null ? authentication.getName() : null);
    }

    @PostMapping("/{notificationId}/read")
    public void markAsRead(Authentication authentication, @PathVariable Long notificationId) {
        reviewNotificationService.markAsRead(authentication != null ? authentication.getName() : null, notificationId);
    }
}
