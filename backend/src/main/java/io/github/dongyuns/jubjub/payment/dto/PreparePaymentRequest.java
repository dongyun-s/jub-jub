package io.github.dongyuns.jubjub.payment.dto;

import io.github.dongyuns.jubjub.payment.domain.PaymentMethod;
import jakarta.validation.constraints.NotNull;

public record PreparePaymentRequest(
        @NotNull Long orderId,
        @NotNull PaymentMethod method
) {
}
