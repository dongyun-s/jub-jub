package io.github.dongyuns.jubjub.payment.dto;

import io.github.dongyuns.jubjub.payment.domain.Order;
import io.github.dongyuns.jubjub.payment.domain.OrderStatus;

public record OrderResponse(
        Long orderId,
        String orderNo,
        Long customerProfileId,
        Long storeId,
        OrderStatus orderStatus,
        Integer finalAmount,
        Long paymentId
) {
    public static OrderResponse from(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getOrderNo(),
                order.getCustomerProfileId(),
                order.getStoreId(),
                order.getStatus(),
                order.getFinalAmount(),
                order.getPayment() != null ? order.getPayment().getId() : null
        );
    }
}
