package io.github.dongyuns.jubjub.domain.owner.order.dto;

import io.github.dongyuns.jubjub.domain.core.order.entity.Order;
import io.github.dongyuns.jubjub.domain.core.order.entity.OrderStatus;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTracking;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTrackingStatus;
import java.time.LocalDateTime;

public record OwnerOrderListResponse(
        Long orderId,
        String orderNo,
        String customerNickname,
        OrderStatus orderStatus,
        OrderTrackingStatus trackingStatus,
        Integer totalQuantity,
        Integer finalAmount,
        LocalDateTime orderedAt,
        LocalDateTime paidAt
) {
    public static OwnerOrderListResponse from(Order order, OrderTracking tracking) {
        int totalQuantity = order.getItems().stream()
                .mapToInt(item -> item.getQuantity() != null ? item.getQuantity() : 0)
                .sum();

        return new OwnerOrderListResponse(
                order.getId(),
                order.getOrderNo(),
                order.getMemberProfile().getNickname(),
                order.getStatus(),
                tracking != null ? tracking.getStatus() : null,
                totalQuantity,
                order.getFinalAmount(),
                order.getCreatedAt(),
                order.getPaidAt()
        );
    }
}
