package io.github.dongyuns.jubjub.domain.customer.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RefundPaymentRequest(
        @NotNull Integer amount,
        @NotBlank String reason
) {
}
