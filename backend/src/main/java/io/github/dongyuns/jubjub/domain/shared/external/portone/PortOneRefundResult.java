package io.github.dongyuns.jubjub.domain.shared.external.portone;

import java.time.LocalDateTime;

public record PortOneRefundResult(
        String cancellationId,
        Integer refundAmount,
        String rawDataJson,
        LocalDateTime refundedAt
) {
}
