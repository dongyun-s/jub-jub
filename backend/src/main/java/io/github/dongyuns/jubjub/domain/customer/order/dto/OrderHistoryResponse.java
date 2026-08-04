package io.github.dongyuns.jubjub.domain.customer.order.dto;

import io.github.dongyuns.jubjub.domain.core.order.entity.Order;
import io.github.dongyuns.jubjub.domain.core.order.entity.OrderItem;
import io.github.dongyuns.jubjub.domain.core.order.entity.OrderItemOption;
import io.github.dongyuns.jubjub.domain.core.order.entity.OrderStatus;
import io.github.dongyuns.jubjub.domain.core.payment.entity.Payment;
import io.github.dongyuns.jubjub.domain.core.payment.entity.PaymentStatus;
import java.time.LocalDateTime;
import java.util.List;

public record OrderHistoryResponse(
        Long orderId,
        String orderNo,
        String storeName,
        LocalDateTime orderedAt,
        OrderStatus orderStatus,
        Integer originalAmount,
        Integer tierDiscountAmount,
        Integer couponDiscountAmount,
        Integer ecoDiscountAmount,
        Integer finalAmount,
        Boolean useMultiUseContainer,
        List<Long> usedCouponIds,
        Integer pickupDistanceMeters,
        List<OrderItemResponse> items,
        Long paymentRecordId,
        PaymentStatus paymentStatus,
        String merchantUid,
        LocalDateTime paidAt
) {
    public static OrderHistoryResponse from(Order order, Payment payment) {
        return new OrderHistoryResponse(
                order.getId(),
                order.getOrderNo(),
                order.getStore().getName(),
                order.getCreatedAt(),
                order.getStatus(),
                order.getOriginalAmount(),
                order.getTierDiscountAmount(),
                order.getCouponDiscountAmount(),
                order.getEcoDiscountAmount(),
                order.getFinalAmount(),
                order.getUseMultiUseContainer(),
                order.getUsedCouponIds(),
                order.getPickupDistanceMeters(),
                order.getItems().stream()
                        .map(OrderItemResponse::from)
                        .toList(),
                payment != null ? payment.getId() : null,
                payment != null ? payment.getStatus() : null,
                payment != null ? payment.getMerchantUid() : null,
                payment != null ? payment.getPaidAt() : null
        );
    }

    public record OrderItemResponse(
            Long orderItemId,
            Long menuId,
            String menuName,
            Integer menuPrice,
            Integer quantity,
            String requestMemo,
            Integer itemTotalAmount,
            List<OrderItemOptionResponse> options
    ) {
        public static OrderItemResponse from(OrderItem item) {
            return new OrderItemResponse(
                    item.getId(),
                    item.getMenuId(),
                    item.getMenuName(),
                    item.getMenuPrice(),
                    item.getQuantity(),
                    item.getRequestMemo(),
                    item.getItemTotalAmount(),
                    item.getOptions().stream()
                            .map(OrderItemOptionResponse::from)
                            .toList()
            );
        }
    }

    public record OrderItemOptionResponse(
            Long orderItemOptionId,
            Long menuOptionId,
            String optionName,
            Integer additionalPrice
    ) {
        public static OrderItemOptionResponse from(OrderItemOption option) {
            return new OrderItemOptionResponse(
                    option.getId(),
                    option.getMenuOptionId(),
                    option.getOptionName(),
                    option.getAdditionalPrice()
            );
        }
    }
}
