package io.github.dongyuns.jubjub.domain.shared.external.portone;

public interface PortOneClient {

    PortOnePaymentDetails getPayment(String paymentId);

    PortOneRefundResult refund(String paymentId, PortOneRefundCommand command);

    boolean verifyWebhookSignature(
            String payloadJson,
            String webhookId,
            String webhookSignature,
            String webhookTimestamp
    );
}
