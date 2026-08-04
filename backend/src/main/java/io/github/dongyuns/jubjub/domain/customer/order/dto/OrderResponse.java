package io.github.dongyuns.jubjub.domain.customer.order.dto;

import io.github.dongyuns.jubjub.domain.core.order.entity.Order;
import io.github.dongyuns.jubjub.domain.core.order.entity.OrderStatus;
import java.util.List;

public record OrderResponse(
        Long orderId,
        String orderNo,
        Long memberProfileId,
        Long storeId,
        OrderStatus orderStatus,
        Integer originalAmount,
        Integer tierDiscountAmount,
        Integer couponDiscountAmount,
        Integer ecoDiscountAmount,
        Integer finalAmount,
        Boolean useMultiUseContainer,
        List<Long> usedCouponIds,
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
                order.getOriginalAmount(),
                order.getTierDiscountAmount(),
                order.getCouponDiscountAmount(),
                order.getEcoDiscountAmount(),
                order.getFinalAmount(),
                order.getUseMultiUseContainer(),
                order.getUsedCouponIds(),
                paymentId
        );
    }
}
