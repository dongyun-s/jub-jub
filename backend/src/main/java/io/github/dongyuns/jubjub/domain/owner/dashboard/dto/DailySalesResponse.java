package io.github.dongyuns.jubjub.domain.owner.dashboard.dto;

import java.time.LocalDate;

public record DailySalesResponse(
        LocalDate date,
        Long salesAmount
) {
}
