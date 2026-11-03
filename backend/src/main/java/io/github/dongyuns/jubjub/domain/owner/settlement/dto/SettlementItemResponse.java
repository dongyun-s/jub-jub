package io.github.dongyuns.jubjub.domain.owner.settlement.dto;

import io.github.dongyuns.jubjub.domain.core.settlement.entity.SettlementItem;
import io.github.dongyuns.jubjub.domain.core.settlement.entity.SettlementItemType;

public record SettlementItemResponse(
        Long settlementItemId,
        Long orderId,
        Long paymentId,
        SettlementItemType type,
        Integer amount
) {
    public static SettlementItemResponse from(SettlementItem item) {
        return new SettlementItemResponse(
                item.getId(),
                item.getOrderId(),
                item.getPaymentId(),
                item.getType(),
                item.getAmount()
        );
    }
}
