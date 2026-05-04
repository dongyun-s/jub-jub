package io.github.dongyuns.jubjub.domain.reward.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "쿠폰_정책")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CouponPolicy {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "쿠폰정책번호")
    private Long id;

    @Column(name = "쿠폰명")
    private String name;

    @Column(name = "발급조건유형")
    private String conditionType; // DISTANCE, ECO, ATTENDANCE, WELCOME

    @Column(name = "할인금액")
    private Integer discountAmount;

    @Column(name = "할인율")
    private Double discountRate;

    @Column(name = "최소주문금액")
    private Integer minOrderAmount;

    @Column(name = "유효기간_일수")
    private Integer validDays;

    @Builder
    public CouponPolicy(String name, String conditionType, Integer discountAmount, Double discountRate, Integer minOrderAmount, Integer validDays) {
        this.name = name;
        this.conditionType = conditionType;
        this.discountAmount = discountAmount != null ? discountAmount : 0;
        this.discountRate = discountRate != null ? discountRate : 0.0;
        this.minOrderAmount = minOrderAmount != null ? minOrderAmount : 0;
        this.validDays = validDays;
    }
}