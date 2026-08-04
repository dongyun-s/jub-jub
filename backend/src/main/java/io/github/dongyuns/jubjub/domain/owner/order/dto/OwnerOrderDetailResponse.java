package io.github.dongyuns.jubjub.domain.owner.order.dto;

import io.github.dongyuns.jubjub.domain.core.order.entity.Order;
import io.github.dongyuns.jubjub.domain.core.order.entity.OrderStatus;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTracking;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTrackingStatus;
import java.time.LocalDateTime;
import java.util.List;

public record OwnerOrderDetailResponse(
        Long orderId,
        String orderNo,
        String customerName,
        String customerNickname,
        String customerPhone,
        OrderStatus orderStatus,
        OrderTrackingStatus trackingStatus,
        Integer originalAmount,
        Integer tierDiscountAmount,
        Integer couponDiscountAmount,
        Integer ecoDiscountAmount,
        Integer finalAmount,
        Boolean useMultiUseContainer,
        LocalDateTime orderedAt,
        LocalDateTime paidAt,
        LocalDateTime estimatedPickupTime,
        List<OwnerOrderItemResponse> items
) {
    public static OwnerOrderDetailResponse from(Order order, OrderTracking tracking) {
        return new OwnerOrderDetailResponse(
                order.getId(),
                order.getOrderNo(),
                order.getMemberProfile().getName(),
                order.getMemberProfile().getNickname(),
                order.getMemberProfile().getPhone(),
                order.getStatus(),
                tracking != null ? tracking.getStatus() : null,
                order.getOriginalAmount(),
                order.getTierDiscountAmount(),
                order.getCouponDiscountAmount(),
                order.getEcoDiscountAmount(),
                order.getFinalAmount(),
                order.getUseMultiUseContainer(),
                order.getCreatedAt(),
                order.getPaidAt(),
                tracking != null ? tracking.getEstimatedPickupTime() : null,
                order.getItems().stream().map(OwnerOrderItemResponse::from).toList()
        );
    }
}
