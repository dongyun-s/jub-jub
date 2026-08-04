package io.github.dongyuns.jubjub.domain.customer.payment.controller;

import io.github.dongyuns.jubjub.domain.customer.payment.dto.ConfirmPaymentRequest;
import io.github.dongyuns.jubjub.domain.customer.payment.dto.PaymentResponse;
import io.github.dongyuns.jubjub.domain.customer.payment.dto.PreparePaymentRequest;
import io.github.dongyuns.jubjub.domain.customer.payment.dto.PreparePaymentResponse;
import io.github.dongyuns.jubjub.domain.customer.payment.dto.RefundPaymentRequest;
import io.github.dongyuns.jubjub.domain.customer.payment.dto.RefundResponse;
import io.github.dongyuns.jubjub.domain.customer.payment.dto.WebhookResponse;
import io.github.dongyuns.jubjub.domain.core.payment.service.PaymentService;
import io.github.dongyuns.jubjub.domain.core.payment.service.PaymentWebhookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
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
    public PreparePaymentResponse prepare(Authentication authentication, @Valid @RequestBody PreparePaymentRequest request) {
        // PortOne 결제창 호출 전에 내부 결제 레코드를 READY 상태로 만들어 둔다.
        return paymentService.preparePayment(authentication.getName(), request);
    }

    @PostMapping("/confirm")
    public PaymentResponse confirm(Authentication authentication, @Valid @RequestBody ConfirmPaymentRequest request) {
        // 결제창 응답값만 믿지 않고 서버에서 PortOne 조회 후 다시 승인 처리한다.
        return paymentService.confirmPayment(authentication.getName(), request);
    }

    @PostMapping("/webhook")
    public WebhookResponse webhook(
            @RequestHeader(name = "webhook-id", required = false) String webhookId,
            @RequestHeader(name = "webhook-signature", required = false) String webhookSignature,
            @RequestHeader(name = "webhook-timestamp", required = false) String webhookTimestamp,
            @RequestBody String payload
    ) {
        // 비동기 웹훅은 서명 검증과 중복 방지를 거쳐 내부 상태를 맞춘다.
        return paymentWebhookService.process(payload, webhookId, webhookSignature, webhookTimestamp);
    }

    @PostMapping("/{paymentRecordId}/refund")
    public RefundResponse refund(
            Authentication authentication,
            @PathVariable Long paymentRecordId,
            @Valid @RequestBody RefundPaymentRequest request
    ) {
        // 환불은 내부 결제 건을 기준으로 PortOne 환불 API를 호출한다.
        return paymentService.refundPayment(authentication.getName(), paymentRecordId, request);
    }
}
