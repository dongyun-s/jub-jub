package io.github.dongyuns.jubjub.payment.dto;

import io.github.dongyuns.jubjub.payment.domain.Order;
import io.github.dongyuns.jubjub.payment.domain.OrderStatus;

public record OrderResponse(
        Long orderId,
        String orderNo,
        Long memberProfileId,
        Long storeId,
        OrderStatus orderStatus,
        Integer finalAmount,
        Long paymentId
) {
    public static OrderResponse from(Order order) {
        return from(order, null);
    }

    public static OrderResponse from(Order order, Long paymentId) {
        return new OrderResponse(
                order.getId(),
                order.getOrderNo(),
                order.getMemberProfileId(),
                order.getStoreId(),
                order.getStatus(),
                order.getFinalAmount(),
                paymentId
        );
    }
}
