package io.github.dongyuns.jubjub.payment.dto;

import io.github.dongyuns.jubjub.payment.domain.Order;
import io.github.dongyuns.jubjub.payment.domain.OrderStatus;
import io.github.dongyuns.jubjub.payment.domain.Payment;
import io.github.dongyuns.jubjub.payment.domain.PaymentStatus;
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
                payment != null ? payment.getId() : null,
                payment != null ? payment.getStatus() : null,
                payment != null ? payment.getMerchantUid() : null,
                payment != null ? payment.getPaidAt() : null
        );
    }
}
