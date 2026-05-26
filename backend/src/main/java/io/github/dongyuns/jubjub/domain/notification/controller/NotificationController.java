package io.github.dongyuns.jubjub.domain.notification.controller;

import io.github.dongyuns.jubjub.domain.notification.dto.NotificationListResponse;
import io.github.dongyuns.jubjub.domain.notification.dto.NotificationType;
import io.github.dongyuns.jubjub.domain.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public NotificationListResponse getMyNotifications(Authentication authentication) {
        return notificationService.getMyNotifications(authentication != null ? authentication.getName() : null);
    }

    @PostMapping("/read-all")
    public void markAllAsRead(Authentication authentication) {
        notificationService.markAllAsRead(authentication != null ? authentication.getName() : null);
    }

    @PostMapping("/{type}/{notificationId}/read")
    public void markAsRead(
            Authentication authentication,
            @PathVariable NotificationType type,
            @PathVariable Long notificationId
    ) {
        notificationService.markAsRead(authentication != null ? authentication.getName() : null, type, notificationId);
    }

    @PostMapping("/{notificationId}/read")
    public void markAsRead(
            Authentication authentication,
            @PathVariable Long notificationId
    ) {
        notificationService.markAsRead(authentication != null ? authentication.getName() : null, notificationId);
    }
}
