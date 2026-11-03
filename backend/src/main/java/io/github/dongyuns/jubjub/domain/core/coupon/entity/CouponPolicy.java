package io.github.dongyuns.jubjub.domain.core.coupon.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "coupon_policy")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CouponPolicy {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String conditionType; // DISTANCE, ECO, ATTENDANCE, WELCOME
    private Integer discountAmount;
    private Double discountRate;
    private Integer minOrderAmount;
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