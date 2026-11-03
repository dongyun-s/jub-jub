package io.github.dongyuns.jubjub.domain.customer.order.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateOrderRequest(
        @NotNull Long storeId,
        @NotNull Integer totalAmount,
        List<Long> memberCouponIds,
        Boolean useMultiUseContainer
) {
}
