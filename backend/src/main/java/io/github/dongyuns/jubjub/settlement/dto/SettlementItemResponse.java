package io.github.dongyuns.jubjub.settlement.dto;

import io.github.dongyuns.jubjub.settlement.domain.SettlementItem;
import io.github.dongyuns.jubjub.settlement.domain.SettlementItemType;

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
