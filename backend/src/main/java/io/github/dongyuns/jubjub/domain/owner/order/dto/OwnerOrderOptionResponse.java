package io.github.dongyuns.jubjub.domain.owner.order.dto;

import io.github.dongyuns.jubjub.domain.core.order.entity.OrderItemOption;

public record OwnerOrderOptionResponse(
        Long optionId,
        Long menuOptionId,
        String optionName,
        Integer additionalPrice
) {
    public static OwnerOrderOptionResponse from(OrderItemOption option) {
        return new OwnerOrderOptionResponse(
                option.getId(),
                option.getMenuOptionId(),
                option.getOptionName(),
                option.getAdditionalPrice()
        );
    }
}
