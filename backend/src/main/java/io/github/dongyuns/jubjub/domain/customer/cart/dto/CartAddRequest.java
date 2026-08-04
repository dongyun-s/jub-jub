package io.github.dongyuns.jubjub.domain.customer.cart.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class CartAddRequest {

    private Long storeId;           // 매장 번호
    private Long menuId;            // 메뉴 번호
    private Integer quantity;       // 수량 (예: 1)
    private String requestMemo;     // 요청사항
    private List<Long> optionIds;   // 선택한 옵션 상세 번호들 (예: [치즈 추가 ID, 구운 양파 추가 ID])

}