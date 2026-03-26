package io.github.dongyuns.jubjub.payment.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.payment.domain.WebhookEvent;
import io.github.dongyuns.jubjub.payment.domain.WebhookEventType;
import io.github.dongyuns.jubjub.payment.domain.WebhookProvider;
import io.github.dongyuns.jubjub.payment.dto.WebhookRequest;
import io.github.dongyuns.jubjub.payment.dto.WebhookResponse;
import io.github.dongyuns.jubjub.payment.portone.PortOneClient;
import io.github.dongyuns.jubjub.payment.repository.WebhookEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PaymentWebhookService {

    private final WebhookEventRepository webhookEventRepository;
    private final PaymentService paymentService;
    private final PortOneClient portOneClient;
    private final ObjectMapper objectMapper;

    public WebhookResponse process(
            String payload,
            String webhookId,
            String webhookSignature,
            String webhookTimestamp
    ) {
        // 웹훅은 외부 요청이라 가장 먼저 서명을 확인한다.
        if (!portOneClient.verifyWebhookSignature(payload, webhookId, webhookSignature, webhookTimestamp)) {
            throw new BusinessException("INVALID_WEBHOOK_SIGNATURE", "웹훅 서명 검증에 실패했습니다.", HttpStatus.UNAUTHORIZED);
        }

        WebhookRequest request = parseRequest(payload);
        WebhookEventType eventType = WebhookEventType.from(request.type());
        WebhookEvent event = WebhookEvent.received(
                WebhookProvider.PORTONE,
                eventType,
                dedupeKeyOf(request.data().paymentId(), request.data().transactionId(), request.data().cancellationId(), eventType),
                request.data().paymentId(),
                request.data().paymentId(),
                request.data().transactionId(),
                request.data().cancellationId(),
                payload
        );

        try {
            webhookEventRepository.save(event);
        } catch (DataIntegrityViolationException exception) {
            // 같은 이벤트를 여러 번 받아도 한 번만 처리하기 위한 중복 방지다.
            return WebhookResponse.duplicate("이미 처리된 웹훅입니다.");
        }

        try {
            // V2 이벤트 타입에 맞춰 내부 결제 상태를 동기화한다.
            switch (eventType) {
                case TRANSACTION_READY -> {
                    // READY 이벤트는 내부에서도 이미 준비 상태를 만들기 때문에 기록만 남긴다.
                }
                case TRANSACTION_PAID -> paymentService.confirmPaymentByWebhook(request.data().paymentId(), request.data().transactionId());
                case TRANSACTION_FAILED -> paymentService.markPaymentFailed(request.data().paymentId(), request.data().transactionId());
                case TRANSACTION_CANCELLED, TRANSACTION_PARTIAL_CANCELLED ->
                        paymentService.markPaymentRefunded(request.data().paymentId(), request.data().transactionId());
                case UNKNOWN -> throw new BusinessException("UNKNOWN_WEBHOOK_EVENT", "지원하지 않는 웹훅 이벤트입니다.", HttpStatus.BAD_REQUEST);
            }

            event.markProcessed();
            webhookEventRepository.save(event);
            return WebhookResponse.processed("웹훅 처리가 완료되었습니다.");
        } catch (RuntimeException exception) {
            event.markFailed();
            webhookEventRepository.save(event);
            if (exception instanceof BusinessException businessException) {
                return WebhookResponse.failed(businessException.getMessage());
            }
            return WebhookResponse.failed("웹훅 처리 중 오류가 발생했습니다.");
        }
    }

    private WebhookRequest parseRequest(String payload) {
        try {
            return objectMapper.readValue(payload, WebhookRequest.class);
        } catch (JsonProcessingException exception) {
            throw new BusinessException("INVALID_WEBHOOK_PAYLOAD", "웹훅 본문 형식이 올바르지 않습니다.", HttpStatus.BAD_REQUEST);
        }
    }

    private String dedupeKeyOf(String paymentId, String transactionId, String cancellationId, WebhookEventType eventType) {
        // 취소 이벤트는 cancellationId, 결제 이벤트는 transactionId를 우선 키로 사용한다.
        String eventResourceId = cancellationId != null && !cancellationId.isBlank()
                ? cancellationId
                : (transactionId != null && !transactionId.isBlank() ? transactionId : paymentId);
        return eventResourceId + ":" + eventType.name();
    }
}
