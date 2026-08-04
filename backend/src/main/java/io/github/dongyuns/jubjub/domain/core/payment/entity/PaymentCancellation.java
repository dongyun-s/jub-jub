package io.github.dongyuns.jubjub.domain.core.payment.entity;

import io.github.dongyuns.jubjub.common.entity.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "payment_cancellations")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PaymentCancellation extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    @Column(unique = true, length = 120)
    private String portoneCancellationId;

    @Column(nullable = false)
    private Integer amount;

    @Column(nullable = false, length = 255)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RefundStatus status;

    private LocalDateTime requestedAt;

    private LocalDateTime cancelledAt;

    @Column(columnDefinition = "JSON")
    private String rawJson;

    @Builder
    private PaymentCancellation(
            Payment payment,
            String portoneCancellationId,
            Integer amount,
            String reason,
            RefundStatus status,
            LocalDateTime requestedAt,
            LocalDateTime cancelledAt,
            String rawJson
    ) {
        this.payment = payment;
        this.portoneCancellationId = portoneCancellationId;
        this.amount = amount;
        this.reason = reason;
        this.status = status;
        this.requestedAt = requestedAt;
        this.cancelledAt = cancelledAt;
        this.rawJson = rawJson;
    }

    public static PaymentCancellation refunded(
            Payment payment,
            String portoneCancellationId,
            Integer amount,
            String reason,
            String rawJson,
            LocalDateTime requestedAt,
            LocalDateTime cancelledAt
    ) {
        // 현재 구현은 전체 환불만 지원하지만, 기록 구조는 환불 이력 확장에 대비해 둔다.
        return PaymentCancellation.builder()
                .payment(payment)
                .portoneCancellationId(portoneCancellationId)
                .amount(amount)
                .reason(reason)
                .status(RefundStatus.REFUNDED)
                .rawJson(rawJson)
                .requestedAt(requestedAt)
                .cancelledAt(cancelledAt)
                .build();
    }
}
