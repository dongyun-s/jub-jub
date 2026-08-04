package io.github.dongyuns.jubjub.domain.core.settlement.entity;

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
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
        name = "settlement_items",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_settlement_item_source", columnNames = {"source_type", "source_id"})
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SettlementItem extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "settlement_id", nullable = false)
    private Settlement settlement;

    @Column(nullable = false)
    private Long orderId;

    @Column(nullable = false)
    private Long paymentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SettlementItemType type;

    @Column(nullable = false)
    private Integer amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private SettlementSourceType sourceType;

    @Column(nullable = false)
    private Long sourceId;

    @Builder
    private SettlementItem(
            Settlement settlement,
            Long orderId,
            Long paymentId,
            SettlementItemType type,
            Integer amount,
            SettlementSourceType sourceType,
            Long sourceId
    ) {
        this.settlement = settlement;
        this.orderId = orderId;
        this.paymentId = paymentId;
        this.type = type;
        this.amount = amount;
        this.sourceType = sourceType;
        this.sourceId = sourceId;
    }

    public static SettlementItem payment(Settlement settlement, Long orderId, Long paymentId, Integer amount, Long sourceId) {
        // 승인 거래는 정산서에 매출 항목으로 반영된다.
        return SettlementItem.builder()
                .settlement(settlement)
                .orderId(orderId)
                .paymentId(paymentId)
                .type(SettlementItemType.PAYMENT)
                .amount(amount)
                .sourceType(SettlementSourceType.PAYMENT_TRANSACTION)
                .sourceId(sourceId)
                .build();
    }

    public static SettlementItem refund(Settlement settlement, Long orderId, Long paymentId, Integer amount, Long sourceId) {
        // 환불 거래는 정산서에 차감 항목으로 반영된다.
        return SettlementItem.builder()
                .settlement(settlement)
                .orderId(orderId)
                .paymentId(paymentId)
                .type(SettlementItemType.REFUND)
                .amount(amount)
                .sourceType(SettlementSourceType.PAYMENT_CANCELLATION)
                .sourceId(sourceId)
                .build();
    }
}
