package io.github.dongyuns.jubjub.domain.customer.cart.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CartItemResponse {
    private Long cartId;
    private Long menuId;
    private String menuName;
    private Integer menuPrice; // 메뉴 기본 가격
    private Integer quantity;  // 수량
    private String requestMemo; // 요청사항

    // 이 메뉴에 딸린 옵션들 목록
    private List<CartOptionResponse> options;

    // 🌟 이 메뉴의 총 가격 = (메뉴 기본가 + 옵션 가격들) * 수량
    private Integer itemTotalPrice;
}