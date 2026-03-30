package io.github.dongyuns.jubjub.settlement.domain;

import io.github.dongyuns.jubjub.payment.domain.BaseTimeEntity;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
        name = "settlements",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_settlement_store_period", columnNames = {"store_id", "period_start", "period_end"})
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Settlement extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long storeId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "settlement_account_id", nullable = false)
    private SettlementAccount settlementAccount;

    @Column(nullable = false)
    private LocalDate periodStart;

    @Column(nullable = false)
    private LocalDate periodEnd;

    @Column(nullable = false)
    private Integer grossAmount;

    @Column(nullable = false)
    private Integer refundAmount;

    @Column(nullable = false)
    private Integer platformFeeAmount;

    @Column(nullable = false)
    private Integer pgFeeAmount;

    @Column(nullable = false)
    private Integer netPayoutAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PayoutStatus payoutStatus;

    private LocalDateTime payoutExpectedAt;

    private LocalDateTime payoutCompletedAt;

    @Builder
    private Settlement(
            Long storeId,
            SettlementAccount settlementAccount,
            LocalDate periodStart,
            LocalDate periodEnd,
            Integer grossAmount,
            Integer refundAmount,
            Integer platformFeeAmount,
            Integer pgFeeAmount,
            Integer netPayoutAmount,
            PayoutStatus payoutStatus,
            LocalDateTime payoutExpectedAt
    ) {
        this.storeId = storeId;
        this.settlementAccount = settlementAccount;
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.grossAmount = grossAmount;
        this.refundAmount = refundAmount;
        this.platformFeeAmount = platformFeeAmount;
        this.pgFeeAmount = pgFeeAmount;
        this.netPayoutAmount = netPayoutAmount;
        this.payoutStatus = payoutStatus;
        this.payoutExpectedAt = payoutExpectedAt;
    }

    public static Settlement create(
            Long storeId,
            SettlementAccount settlementAccount,
            LocalDate periodStart,
            LocalDate periodEnd,
            Integer grossAmount,
            Integer refundAmount,
            Integer platformFeeAmount,
            Integer pgFeeAmount,
            Integer netPayoutAmount,
            LocalDateTime payoutExpectedAt
    ) {
        // 정산서는 한 기간의 총매출, 환불, 수수료, 실지급액을 한 번에 들고 있는 집계 단위다.
        return Settlement.builder()
                .storeId(storeId)
                .settlementAccount(settlementAccount)
                .periodStart(periodStart)
                .periodEnd(periodEnd)
                .grossAmount(grossAmount)
                .refundAmount(refundAmount)
                .platformFeeAmount(platformFeeAmount)
                .pgFeeAmount(pgFeeAmount)
                .netPayoutAmount(netPayoutAmount)
                .payoutStatus(PayoutStatus.READY)
                .payoutExpectedAt(payoutExpectedAt)
                .build();
    }
}
