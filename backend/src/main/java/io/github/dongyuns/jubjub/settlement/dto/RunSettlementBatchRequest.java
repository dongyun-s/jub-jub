package io.github.dongyuns.jubjub.settlement.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record RunSettlementBatchRequest(
        Long storeId,
        @NotNull LocalDate periodStart,
        @NotNull LocalDate periodEnd
) {
}
