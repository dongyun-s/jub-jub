package io.github.dongyuns.jubjub.domain.owner.dashboard.dto;

public record BestMenuResponse(
        Long menuId,
        String menuName,
        Long orderQuantity,
        Long salesAmount
) {
}
