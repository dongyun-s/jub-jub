package io.github.dongyuns.jubjub.payment.dto;

import jakarta.validation.constraints.NotBlank;

public record ConfirmPaymentRequest(
        String merchantUid,
        String paymentId,
        String transactionId
) {
    public String resolvedMerchantUid() {
        if (merchantUid != null && !merchantUid.isBlank()) {
            return merchantUid;
        }
        if (paymentId != null && !paymentId.isBlank()) {
            return paymentId;
        }
        throw new IllegalArgumentException("merchantUid 또는 paymentId는 필수입니다.");
    }
}
