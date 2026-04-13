package io.github.dongyuns.jubjub.payment.service;

public record PaymentApprovedEvent(
        Long paymentId,
        String transactionId,
        Integer amount,
        String rawJson
) {
}
