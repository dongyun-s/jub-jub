package io.github.dongyuns.jubjub.payment.dto;

import jakarta.validation.constraints.NotNull;

public record CreateOrderRequest(
        @NotNull Long storeId,
        @NotNull Integer totalAmount
) {
}
