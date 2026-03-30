package io.github.dongyuns.jubjub.settlement.dto;

import io.github.dongyuns.jubjub.settlement.domain.PayoutStatus;
import io.github.dongyuns.jubjub.settlement.domain.Settlement;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record SettlementResponse(
        Long settlementId,
        Long storeId,
        Long settlementAccountId,
        LocalDate periodStart,
        LocalDate periodEnd,
        Integer grossAmount,
        Integer refundAmount,
        Integer platformFeeAmount,
        Integer pgFeeAmount,
        Integer netPayoutAmount,
        PayoutStatus payoutStatus,
        LocalDateTime payoutExpectedAt,
        List<SettlementItemResponse> items
) {
    public static SettlementResponse of(Settlement settlement, List<SettlementItemResponse> items) {
        return new SettlementResponse(
                settlement.getId(),
                settlement.getStoreId(),
                settlement.getSettlementAccount().getId(),
                settlement.getPeriodStart(),
                settlement.getPeriodEnd(),
                settlement.getGrossAmount(),
                settlement.getRefundAmount(),
                settlement.getPlatformFeeAmount(),
                settlement.getPgFeeAmount(),
                settlement.getNetPayoutAmount(),
                settlement.getPayoutStatus(),
                settlement.getPayoutExpectedAt(),
                items
        );
    }
}
