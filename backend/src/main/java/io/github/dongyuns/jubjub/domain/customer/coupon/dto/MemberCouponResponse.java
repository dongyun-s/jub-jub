package io.github.dongyuns.jubjub.domain.customer.coupon.dto;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDate;

@Getter
@Builder
public class MemberCouponResponse {
    private Long memberCouponId; // 사용하기 버튼 누를 때 백엔드로 보낼 ID
    private String name;         // 쿠폰명 (예: 다회용기 지참 감사 쿠폰)
    private int discountAmount;  // 할인 금액 (예: 200)
    private int minOrderAmount;  // 최소 주문 금액 (예: 0이면 조건 없음)
    private LocalDate expiredAt; // 만료일 (화면 표시용)
}