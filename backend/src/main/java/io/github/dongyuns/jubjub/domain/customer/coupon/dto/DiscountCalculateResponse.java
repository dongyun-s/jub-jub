package io.github.dongyuns.jubjub.domain.customer.coupon.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DiscountCalculateResponse {
    private int originalAmount;         // 원래 주문 금액
    private int tierDiscountAmount;     // 등급 할인으로 깎인 금액
    private int couponDiscountAmount;   // 쿠폰 사용으로 깎인 금액
    private int finalPaymentAmount;     // 최종 결제 확정 금액
}