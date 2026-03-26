package io.github.dongyuns.jubjub.payment.portone;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.portone.sdk.server.errors.WebhookVerificationException;
import io.portone.sdk.server.webhook.WebhookVerifier;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Slf4j
@Component
public class PortOneClientImpl implements PortOneClient {

    private final RestClient restClient;
    private final String apiSecret;
    private final String webhookSecret;
    private final ObjectMapper objectMapper;
    private final WebhookVerifier webhookVerifier;

    public PortOneClientImpl(
            RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper,
            @Value("${portone.base-url:https://api.portone.io}") String baseUrl,
            @Value("${portone.api-secret:}") String apiSecret,
            @Value("${portone.webhook-secret:}") String webhookSecret
    ) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.objectMapper = objectMapper;
        this.apiSecret = apiSecret;
        this.webhookSecret = webhookSecret;
        this.webhookVerifier = webhookSecret == null || webhookSecret.isBlank()
                ? null
                : new WebhookVerifier(webhookSecret);
    }

    @Override
    public PortOnePaymentDetails getPayment(String paymentId) {
        log.info("Fetch PortOne payment details. paymentId={}", paymentId);

        // PortOne 원본 응답을 그대로 들고 와서 서버에서 금액/상태를 다시 검증한다.
        String responseBody = requestPayment(paymentId);
        JsonNode payment = readJson(responseBody);

        return new PortOnePaymentDetails(
                text(payment, "paymentId", "id"),
                text(payment, "transactionId"),
                intValue(payment, "amount", "totalAmount"),
                isPaid(payment),
                paymentMethod(payment),
                responseBody,
                dateTime(payment, "paidAt")
        );
    }

    @Override
    public PortOneRefundResult refund(String paymentId, PortOneRefundCommand command) {
        log.info("Request PortOne refund. paymentId={}, amount={}", paymentId, command.amount());

        validateConfigured("환불");

        String responseBody;
        try {
            responseBody = restClient.post()
                    .uri("/payments/{paymentId}/cancel", paymentId)
                    .header("Authorization", "PortOne " + apiSecret)
                    .header("Idempotency-Key", "\"" + UUID.randomUUID() + "\"")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new CancelPaymentBody(command.amount(), command.reason()))
                    .retrieve()
                    .body(String.class);
        } catch (RestClientResponseException exception) {
            throw mapPortOneException("PORTONE_REFUND_FAILED", "PortOne 환불 요청에 실패했습니다.", exception);
        }

        JsonNode root = readJson(responseBody);
        JsonNode cancellation = root.path("cancellation");
        if (cancellation.isMissingNode() || cancellation.isNull()) {
            throw new BusinessException("PORTONE_REFUND_FAILED", "PortOne 환불 응답 형식이 올바르지 않습니다.", HttpStatus.BAD_GATEWAY);
        }

        return new PortOneRefundResult(
                text(cancellation, "id", "cancellationId"),
                intValue(cancellation, "totalAmount", "amount"),
                responseBody,
                dateTime(cancellation, "cancelledAt")
        );
    }

    @Override
    public boolean verifyWebhookSignature(
            String payloadJson,
            String webhookId,
            String webhookSignature,
            String webhookTimestamp
    ) {
        log.info("Verify PortOne webhook signature");

        if (webhookId == null || webhookId.isBlank()) {
            return false;
        }
        if (webhookSignature == null || webhookSignature.isBlank()) {
            return false;
        }
        if (webhookTimestamp == null || webhookTimestamp.isBlank()) {
            return false;
        }
        if (webhookVerifier == null) {
            return true;
        }

        try {
            webhookVerifier.verify(payloadJson, webhookId, webhookSignature, webhookTimestamp);
            return true;
        } catch (WebhookVerificationException exception) {
            log.warn("PortOne webhook signature verification failed. message={}", exception.getMessage());
            return false;
        }
    }

    RestClient restClient() {
        return restClient;
    }

    private String requestPayment(String paymentId) {
        validateConfigured("결제 조회");

        try {
            // V2 결제 조회는 paymentId 기준이라 prepare 단계에서 만든 식별자를 그대로 쓴다.
            return restClient.get()
                    .uri("/payments/{paymentId}", paymentId)
                    .header("Authorization", "PortOne " + apiSecret)
                    .retrieve()
                    .body(String.class);
        } catch (RestClientResponseException exception) {
            throw mapPortOneException("PORTONE_PAYMENT_LOOKUP_FAILED", "PortOne 결제 조회에 실패했습니다.", exception);
        }
    }

    private void validateConfigured(String action) {
        if (apiSecret == null || apiSecret.isBlank()) {
            throw new BusinessException(
                    "PORTONE_NOT_CONFIGURED",
                    "PortOne 연동 설정이 없어 " + action + "를 수행할 수 없습니다.",
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    private BusinessException mapPortOneException(String code, String fallbackMessage, RestClientResponseException exception) {
        String message = fallbackMessage;
        try {
            JsonNode error = objectMapper.readTree(exception.getResponseBodyAsString());
            String portOneMessage = text(error, "message");
            if (portOneMessage != null && !portOneMessage.isBlank()) {
                message = portOneMessage;
            }
        } catch (JsonProcessingException ignored) {
            // Keep fallback message when PortOne returns a non-JSON error body.
        }
        HttpStatus status = HttpStatus.resolve(exception.getStatusCode().value());
        if (status == null) {
            status = HttpStatus.BAD_GATEWAY;
        }
        return new BusinessException(code, message, status);
    }

    private JsonNode readJson(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (JsonProcessingException exception) {
            throw new BusinessException("PORTONE_RESPONSE_INVALID", "PortOne 응답을 해석할 수 없습니다.", HttpStatus.BAD_GATEWAY);
        }
    }

    private boolean isPaid(JsonNode payment) {
        String status = text(payment, "status");
        return "PAID".equalsIgnoreCase(status);
    }

    private String paymentMethod(JsonNode payment) {
        JsonNode method = payment.path("method");
        if (method.isMissingNode() || method.isNull()) {
            return null;
        }
        if (method.isTextual()) {
            return method.asText();
        }
        return firstNonBlank(
                text(method, "easyPayProvider"),
                text(method, "provider"),
                text(method, "type")
        );
    }

    private Integer intValue(JsonNode node, String... fieldNames) {
        for (String fieldName : fieldNames) {
            JsonNode candidate = node.path(fieldName);
            if (candidate.isInt() || candidate.isLong()) {
                return candidate.asInt();
            }
            if (candidate.isObject()) {
                // 필드 구조가 버전별로 조금 달라도 amount 값을 최대한 흡수한다.
                Integer nested = intValue(candidate, "total", "amount");
                if (nested != null) {
                    return nested;
                }
            }
            if (candidate.isTextual()) {
                try {
                    return Integer.valueOf(candidate.asText());
                } catch (NumberFormatException ignored) {
                    // Try next field candidate.
                }
            }
        }
        return null;
    }

    private String text(JsonNode node, String... fieldNames) {
        for (String fieldName : fieldNames) {
            JsonNode candidate = node.path(fieldName);
            if (candidate.isTextual()) {
                return candidate.asText();
            }
        }
        return null;
    }

    private LocalDateTime dateTime(JsonNode node, String fieldName) {
        JsonNode candidate = node.path(fieldName);
        if (!candidate.isTextual()) {
            return null;
        }
        String value = candidate.asText();
        try {
            return OffsetDateTime.parse(value).toLocalDateTime();
        } catch (DateTimeParseException ignored) {
            try {
                return LocalDateTime.parse(value);
            } catch (DateTimeParseException exception) {
                return null;
            }
        }
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private record CancelPaymentBody(
            Integer amount,
            String reason
    ) {
    }
}
