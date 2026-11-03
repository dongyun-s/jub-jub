package io.github.dongyuns.jubjub.domain.customer.payment.dto;

import io.github.dongyuns.jubjub.domain.core.payment.entity.Payment;
import io.github.dongyuns.jubjub.domain.core.payment.entity.PaymentMethod;
import io.github.dongyuns.jubjub.domain.core.payment.entity.PaymentStatus;
import io.github.dongyuns.jubjub.domain.core.payment.entity.PgProvider;

public record PreparePaymentResponse(
        Long paymentRecordId,
        Long orderId,
        String merchantUid,
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
                payment.getMerchantUid(),
                payment.getPgProvider(),
                payment.getMethod(),
                payment.getStatus(),
                payment.getRequestedAmount()
        );
    }
}
