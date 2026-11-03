package io.github.dongyuns.jubjub.domain.shared.external.portone;

import java.time.LocalDateTime;

public record PortOnePaymentDetails(
        String paymentId,
        String transactionId,
        Integer amount,
        boolean paid,
        String method,
        String rawJson,
        LocalDateTime paidAt
) {
}
