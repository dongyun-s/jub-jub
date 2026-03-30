package io.github.dongyuns.jubjub.payment.dto;

import io.github.dongyuns.jubjub.payment.domain.WebhookProcessStatus;

public record WebhookResponse(
        boolean processed,
        WebhookProcessStatus status,
        String message
) {
    public static WebhookResponse processed(String message) {
        return new WebhookResponse(true, WebhookProcessStatus.PROCESSED, message);
    }

    public static WebhookResponse duplicate(String message) {
        return new WebhookResponse(false, WebhookProcessStatus.DUPLICATE, message);
    }

    public static WebhookResponse failed(String message) {
        return new WebhookResponse(false, WebhookProcessStatus.FAILED, message);
    }
}
