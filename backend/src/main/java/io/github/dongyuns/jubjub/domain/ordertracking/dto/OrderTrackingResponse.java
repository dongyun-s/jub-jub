package io.github.dongyuns.jubjub.domain.ordertracking.dto;

import io.github.dongyuns.jubjub.domain.ordertracking.entity.OrderTracking;
import io.github.dongyuns.jubjub.domain.ordertracking.entity.OrderTrackingStatus;
import io.github.dongyuns.jubjub.payment.domain.Order;
import io.github.dongyuns.jubjub.payment.domain.OrderStatus;
import java.time.LocalDateTime;

public record OrderTrackingResponse(
        Long orderId,
        String orderNo,
        OrderStatus paymentOrderStatus,
        OrderTrackingStatus trackingStatus,
        Integer finalAmount,
        LocalDateTime orderedAt,
        LocalDateTime paidAt,
        LocalDateTime estimatedPickupTime,
        String storeName,
        String storeAddress,
        Double storeLatitude,
        Double storeLongitude
) {
    public static OrderTrackingResponse from(Order order, OrderTracking tracking) {
        return new OrderTrackingResponse(
                order.getId(),
                order.getOrderNo(),
                order.getStatus(),
                tracking != null ? tracking.getStatus() : null,
                order.getFinalAmount(),
                order.getCreatedAt(),
                order.getPaidAt(),
                tracking != null ? tracking.getEstimatedPickupTime() : null,
                order.getStore().getName(),
                order.getStore().getAddress(),
                order.getStore().getLatitude(),
                order.getStore().getLongitude()
        );
    }
}
