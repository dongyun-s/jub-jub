package io.github.dongyuns.jubjub.payment.controller;

import io.github.dongyuns.jubjub.payment.dto.ConfirmPaymentRequest;
import io.github.dongyuns.jubjub.payment.dto.PaymentResponse;
import io.github.dongyuns.jubjub.payment.dto.PreparePaymentRequest;
import io.github.dongyuns.jubjub.payment.dto.PreparePaymentResponse;
import io.github.dongyuns.jubjub.payment.dto.RefundPaymentRequest;
import io.github.dongyuns.jubjub.payment.dto.RefundResponse;
import io.github.dongyuns.jubjub.payment.dto.WebhookResponse;
import io.github.dongyuns.jubjub.payment.service.PaymentService;
import io.github.dongyuns.jubjub.payment.service.PaymentWebhookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentWebhookService paymentWebhookService;

    @PostMapping("/prepare")
    public PreparePaymentResponse prepare(@Valid @RequestBody PreparePaymentRequest request) {
        return paymentService.preparePayment(request);
    }

    @PostMapping("/confirm")
    public PaymentResponse confirm(@Valid @RequestBody ConfirmPaymentRequest request) {
        return paymentService.confirmPayment(request);
    }

    @PostMapping("/webhook")
    public WebhookResponse webhook(
            @RequestHeader(name = "webhook-id", required = false) String webhookId,
            @RequestHeader(name = "webhook-signature", required = false) String webhookSignature,
            @RequestHeader(name = "webhook-timestamp", required = false) String webhookTimestamp,
            @RequestBody String payload
    ) {
        return paymentWebhookService.process(payload, webhookId, webhookSignature, webhookTimestamp);
    }

    @PostMapping("/{paymentId}/refund")
    public RefundResponse refund(
            @PathVariable Long paymentId,
            @Valid @RequestBody RefundPaymentRequest request
    ) {
        return paymentService.refundPayment(paymentId, request);
    }
}
