package io.github.dongyuns.jubjub.payment.dto;

import io.github.dongyuns.jubjub.payment.domain.Payment;
import io.github.dongyuns.jubjub.payment.domain.PaymentMethod;
import io.github.dongyuns.jubjub.payment.domain.PaymentStatus;
import io.github.dongyuns.jubjub.payment.domain.PgProvider;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long paymentRecordId,
        Long orderId,
        String merchantUid,
        String transactionId,
        PgProvider pgProvider,
        PaymentMethod method,
        PaymentStatus paymentStatus,
        Integer requestedAmount,
        Integer paidAmount,
        LocalDateTime paidAt
) {
    public static PaymentResponse from(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getOrder().getId(),
                payment.getMerchantUid(),
                payment.getPortonePaymentId(),
                payment.getPgProvider(),
                payment.getMethod(),
                payment.getStatus(),
                payment.getRequestedAmount(),
                payment.getPaidAmount(),
                payment.getPaidAt()
        );
    }
}
