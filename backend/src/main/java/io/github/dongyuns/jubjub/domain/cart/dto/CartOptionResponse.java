package io.github.dongyuns.jubjub.domain.cart.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CartOptionResponse {
    private Long optionId;
    private String optionName;
    private Integer additionalPrice;
}