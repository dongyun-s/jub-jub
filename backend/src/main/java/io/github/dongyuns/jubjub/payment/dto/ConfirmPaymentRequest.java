package io.github.dongyuns.jubjub.payment.dto;

import jakarta.validation.constraints.NotBlank;

public record ConfirmPaymentRequest(
        @NotBlank String merchantUid,
        String transactionId
) {
}
