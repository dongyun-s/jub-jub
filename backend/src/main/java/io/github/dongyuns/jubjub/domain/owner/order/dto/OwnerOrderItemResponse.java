package io.github.dongyuns.jubjub.domain.owner.order.dto;

import io.github.dongyuns.jubjub.domain.core.order.entity.OrderItem;
import java.util.List;

public record OwnerOrderItemResponse(
        Long orderItemId,
        Long menuId,
        String menuName,
        Integer menuPrice,
        Integer quantity,
        String requestMemo,
        Integer itemTotalAmount,
        List<OwnerOrderOptionResponse> options
) {
    public static OwnerOrderItemResponse from(OrderItem item) {
        return new OwnerOrderItemResponse(
                item.getId(),
                item.getMenuId(),
                item.getMenuName(),
                item.getMenuPrice(),
                item.getQuantity(),
                item.getRequestMemo(),
                item.getItemTotalAmount(),
                item.getOptions().stream().map(OwnerOrderOptionResponse::from).toList()
        );
    }
}
