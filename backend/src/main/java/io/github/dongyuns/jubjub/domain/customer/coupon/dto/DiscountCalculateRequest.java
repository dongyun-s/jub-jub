package io.github.dongyuns.jubjub.domain.customer.coupon.dto;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DiscountCalculateRequest {

    // 1. 원래 상품들의 합계 금액 (할인 전 금액)
    private int originalOrderAmount;

    // 2. 사용자가 이번 주문에 적용하기 위해 선택한 쿠폰 ID 리스트
    // (쿠폰을 안 쓸 수도 있으므로 null이나 빈 리스트가 올 수 있습니다)
    private List<Long> memberCouponIds;

    // 테스트나 내부 생성을 위한 빌더/생성자 (필요시 추가)
    public DiscountCalculateRequest(int originalOrderAmount, List<Long> memberCouponIds) {
        this.originalOrderAmount = originalOrderAmount;
        this.memberCouponIds = memberCouponIds;
    }
}