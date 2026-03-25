package io.github.dongyuns.jubjub.payment.dto;

import io.github.dongyuns.jubjub.payment.domain.Payment;
import io.github.dongyuns.jubjub.payment.domain.PaymentMethod;
import io.github.dongyuns.jubjub.payment.domain.PaymentStatus;
import io.github.dongyuns.jubjub.payment.domain.PgProvider;

public record PreparePaymentResponse(
        Long paymentRecordId,
        Long orderId,
        String paymentId,
        PgProvider pgProvider,
        PaymentMethod method,
        PaymentStatus paymentStatus,
        Integer requestedAmount
) {
    public static PreparePaymentResponse from(Payment payment) {
        return new PreparePaymentResponse(
                payment.getId(),
                payment.getOrder().getId(),
                payment.getMerchantUid(),
                payment.getPgProvider(),
                payment.getMethod(),
                payment.getStatus(),
                payment.getRequestedAmount()
        );
    }
}
