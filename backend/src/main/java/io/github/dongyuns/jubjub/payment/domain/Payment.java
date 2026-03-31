package io.github.dongyuns.jubjub.payment.domain;

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
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
        name = "payments",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_payment_merchant_uid", columnNames = "merchant_uid")
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Payment extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentStatus status;

    @Column(nullable = false, length = 100)
    private String merchantUid;

    // PortOne V2에서는 실제 승인 건 식별자를 transactionId로 저장한다.
    @Column(unique = true, length = 120)
    private String portonePaymentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PgProvider pgProvider;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentMethod method;

    @Column(nullable = false)
    private Integer requestedAmount;

    @Column(nullable = false)
    private Integer paidAmount;

    private LocalDateTime paidAt;

    @Builder
    private Payment(
            Order order,
            PaymentStatus status,
            String merchantUid,
            String portonePaymentId,
            PgProvider pgProvider,
            PaymentMethod method,
            Integer requestedAmount,
            Integer paidAmount
    ) {
        this.order = order;
        this.status = status;
        this.merchantUid = merchantUid;
        this.portonePaymentId = portonePaymentId;
        this.pgProvider = pgProvider;
        this.method = method;
        this.requestedAmount = requestedAmount;
        this.paidAmount = paidAmount;
    }

    public static Payment ready(Order order, String merchantUid, PaymentMethod method) {
        // paymentId는 결제창 호출 전부터 고정해두고 이후 모든 서버 검증의 기준으로 사용한다.
        return Payment.builder()
                .order(order)
                .status(PaymentStatus.READY)
                .merchantUid(merchantUid)
                .pgProvider(PgProvider.PORTONE)
                .method(method)
                .requestedAmount(order.getFinalAmount())
                .paidAmount(0)
                .build();
    }

    public void markPaid(String portonePaymentId, Integer paidAmount, LocalDateTime paidAt) {
        // 서버 검증이 끝나면 승인 transactionId와 실제 승인 금액을 확정한다.
        this.portonePaymentId = portonePaymentId;
        this.paidAmount = paidAmount;
        this.status = PaymentStatus.PAID;
        this.paidAt = paidAt;
    }

    public void markFailed(String portonePaymentId) {
        this.portonePaymentId = portonePaymentId;
        this.status = PaymentStatus.FAILED;
    }

    public void markRefunded() {
        this.status = PaymentStatus.REFUNDED;
    }
}
