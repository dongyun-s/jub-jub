package io.github.dongyuns.jubjub.domain.core.payment.entity;

import io.github.dongyuns.jubjub.common.entity.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "payment_transactions")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PaymentTransaction extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    @Column(unique = true, length = 120)
    private String portoneTransactionId;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(nullable = false)
    private Integer amount;

    @Column(columnDefinition = "JSON")
    private String rawJson;

    @Builder
    private PaymentTransaction(Payment payment, String portoneTransactionId, String status, Integer amount, String rawJson) {
        this.payment = payment;
        this.portoneTransactionId = portoneTransactionId;
        this.status = status;
        this.amount = amount;
        this.rawJson = rawJson;
    }

    public static PaymentTransaction approved(
            Payment payment,
            String portoneTransactionId,
            String status,
            Integer amount,
            String rawJson
    ) {
        // 정산/추적용 원장 역할을 하므로 승인 응답 원본까지 같이 남긴다.
        return PaymentTransaction.builder()
                .payment(payment)
                .portoneTransactionId(portoneTransactionId)
                .status(status)
                .amount(amount)
                .rawJson(rawJson)
                .build();
    }
}
