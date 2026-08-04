package io.github.dongyuns.jubjub.domain.customer.payment.dto;

import io.github.dongyuns.jubjub.domain.core.payment.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;

public record PreparePaymentRequest(
        @NotNull Long orderId,
        @NotNull PaymentMethod method
) {
}
