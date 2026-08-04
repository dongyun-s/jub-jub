package io.github.dongyuns.jubjub.domain.customer.payment.dto;

import io.github.dongyuns.jubjub.domain.core.payment.entity.PaymentCancellation;
import io.github.dongyuns.jubjub.domain.core.payment.entity.RefundStatus;
import java.time.LocalDateTime;

public record RefundResponse(
        Long refundId,
        Long paymentId,
        String portoneRefundId,
        RefundStatus refundStatus,
        Integer refundAmount,
        LocalDateTime refundedAt
) {
    public static RefundResponse from(PaymentCancellation refund) {
        return new RefundResponse(
                refund.getId(),
                refund.getPayment().getId(),
                refund.getPortoneCancellationId(),
                refund.getStatus(),
                refund.getAmount(),
                refund.getCancelledAt()
        );
    }
}
