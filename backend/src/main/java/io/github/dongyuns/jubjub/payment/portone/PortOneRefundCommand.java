package io.github.dongyuns.jubjub.payment.portone;

public record PortOneRefundCommand(
        Integer amount,
        String reason
) {
}
