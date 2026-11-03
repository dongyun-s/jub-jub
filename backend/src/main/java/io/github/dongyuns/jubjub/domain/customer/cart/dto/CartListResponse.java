package io.github.dongyuns.jubjub.domain.customer.cart.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CartListResponse {
    private Long storeId;
    private String storeName; // 화면 맨 위에 띄워줄 가게 이름

    // 장바구니에 담긴 메뉴 목록
    private List<CartItemResponse> cartItems;

    // 🌟 장바구니 전체 총 결제 금액!
    private Integer totalCartPrice;
}