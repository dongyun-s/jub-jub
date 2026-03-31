package io.github.dongyuns.jubjub.payment.dto;

import io.github.dongyuns.jubjub.payment.domain.Order;
import io.github.dongyuns.jubjub.payment.domain.OrderStatus;
import io.github.dongyuns.jubjub.payment.domain.Payment;
import io.github.dongyuns.jubjub.payment.domain.PaymentStatus;
import java.time.LocalDateTime;

public record OrderHistoryResponse(
        Long orderId,
        String orderNo,
        String storeName,
        LocalDateTime orderedAt,
        OrderStatus orderStatus,
        Integer finalAmount,
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
                order.getFinalAmount(),
                payment != null ? payment.getId() : null,
                payment != null ? payment.getStatus() : null,
                payment != null ? payment.getMerchantUid() : null,
                payment != null ? payment.getPaidAt() : null
        );
    }
}
