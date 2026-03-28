package io.github.dongyuns.jubjub.payment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record WebhookRequest(
        @NotBlank String type,
        String timestamp,
        @Valid @NotNull Data data
) {
    public record Data(
            @NotBlank String paymentId,
            @NotBlank String storeId,
            String transactionId,
            String cancellationId
    ) {
    }
}
