package io.github.dongyuns.jubjub.domain.shared.external.portone;

public record PortOneRefundCommand(
        Integer amount,
        String reason
) {
}
