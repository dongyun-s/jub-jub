package io.github.dongyuns.jubjub.domain.owner.order.dto;

import io.github.dongyuns.jubjub.domain.core.order.entity.Order;
import io.github.dongyuns.jubjub.domain.core.order.entity.OrderStatus;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTracking;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTrackingStatus;

public record OwnerOrderStatusResponse(
        Long orderId,
        OrderStatus orderStatus,
        OrderTrackingStatus trackingStatus
) {
    public static OwnerOrderStatusResponse from(Order order, OrderTracking tracking) {
        return new OwnerOrderStatusResponse(order.getId(), order.getStatus(), tracking.getStatus());
    }
}
