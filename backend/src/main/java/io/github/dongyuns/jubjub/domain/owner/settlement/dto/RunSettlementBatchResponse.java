package io.github.dongyuns.jubjub.domain.owner.settlement.dto;

import java.time.LocalDate;
import java.util.List;

public record RunSettlementBatchResponse(
        LocalDate periodStart,
        LocalDate periodEnd,
        int settlementCount,
        List<SettlementResponse> settlements
) {
}
