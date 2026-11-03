package io.github.dongyuns.jubjub.domain.owner.store.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record UpdateStoreMinOrderRequest(
        @NotNull(message = "최소 주문 금액은 필수입니다.")
        @PositiveOrZero(message = "최소 주문 금액은 0원 이상이어야 합니다.")
        Integer minOrderAmount
) {}
