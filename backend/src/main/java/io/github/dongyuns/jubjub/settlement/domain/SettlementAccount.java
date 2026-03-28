package io.github.dongyuns.jubjub.settlement.domain;

import io.github.dongyuns.jubjub.payment.domain.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "settlement_accounts")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SettlementAccount extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long storeId;

    @Column(nullable = false, length = 30)
    private String bankCode;

    @Column(nullable = false, length = 50)
    private String accountNo;

    @Column(nullable = false, length = 100)
    private String holderName;

    @Column(nullable = false)
    private Boolean active;

    // 정산 배치가 지급 대상을 찾을 때 사용하는 매장별 활성 계좌 정보다.
}
