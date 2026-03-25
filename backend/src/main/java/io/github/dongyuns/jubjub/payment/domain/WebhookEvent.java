package io.github.dongyuns.jubjub.payment.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
        name = "webhook_events",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_webhook_dedupe_key", columnNames = "dedupe_key")
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WebhookEvent extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private WebhookProvider provider;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 40)
    private WebhookEventType eventType;

    @Column(name = "dedupe_key", nullable = false, length = 180)
    private String dedupeKey;

    @Column(name = "merchant_uid", length = 100)
    private String merchantUid;

    @Column(name = "portone_payment_id", length = 120)
    private String portonePaymentId;

    @Column(name = "portone_transaction_id", length = 120)
    private String portoneTransactionId;

    @Column(name = "portone_cancellation_id", length = 120)
    private String portoneCancellationId;

    @Column(name = "payload_json", nullable = false, columnDefinition = "JSON")
    private String payloadJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "process_status", nullable = false, length = 30)
    private WebhookProcessStatus processStatus;

    private LocalDateTime receivedAt;

    private LocalDateTime processedAt;

    @Builder
    private WebhookEvent(
            WebhookProvider provider,
            WebhookEventType eventType,
            String dedupeKey,
            String merchantUid,
            String portonePaymentId,
            String portoneTransactionId,
            String portoneCancellationId,
            String payloadJson,
            WebhookProcessStatus processStatus,
            LocalDateTime receivedAt
    ) {
        this.provider = provider;
        this.eventType = eventType;
        this.dedupeKey = dedupeKey;
        this.merchantUid = merchantUid;
        this.portonePaymentId = portonePaymentId;
        this.portoneTransactionId = portoneTransactionId;
        this.portoneCancellationId = portoneCancellationId;
        this.payloadJson = payloadJson;
        this.processStatus = processStatus;
        this.receivedAt = receivedAt;
    }

    public static WebhookEvent received(
            WebhookProvider provider,
            WebhookEventType eventType,
            String dedupeKey,
            String merchantUid,
            String portonePaymentId,
            String portoneTransactionId,
            String portoneCancellationId,
            String payloadJson
    ) {
        return WebhookEvent.builder()
                .provider(provider)
                .eventType(eventType)
                .dedupeKey(dedupeKey)
                .merchantUid(merchantUid)
                .portonePaymentId(portonePaymentId)
                .portoneTransactionId(portoneTransactionId)
                .portoneCancellationId(portoneCancellationId)
                .payloadJson(payloadJson)
                .processStatus(WebhookProcessStatus.RECEIVED)
                .receivedAt(LocalDateTime.now())
                .build();
    }

    public void markProcessed() {
        this.processStatus = WebhookProcessStatus.PROCESSED;
        this.processedAt = LocalDateTime.now();
    }

    public void markFailed() {
        this.processStatus = WebhookProcessStatus.FAILED;
        this.processedAt = LocalDateTime.now();
    }
}
