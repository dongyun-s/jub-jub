package io.github.dongyuns.jubjub.domain.customer.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ConfirmPaymentRequest(
        @NotBlank String merchantUid,
        String transactionId,
        @NotNull Double userLatitude,
        @NotNull Double userLongitude
) {
}
