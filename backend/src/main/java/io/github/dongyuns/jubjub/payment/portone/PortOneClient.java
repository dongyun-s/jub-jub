package io.github.dongyuns.jubjub.payment.portone;

public interface PortOneClient {

    PortOnePaymentDetails getPayment(String paymentId);

    PortOneRefundResult refund(String paymentId, PortOneRefundCommand command);

    boolean verifyWebhookSignature(String signature, String payloadJson);
}
