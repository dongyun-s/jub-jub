package io.github.dongyuns.jubjub.domain.core.payment.event;

public record PaymentApprovedEvent(
        Long paymentId,
        String transactionId,
        Integer amount,
        String rawJson
) {
}
