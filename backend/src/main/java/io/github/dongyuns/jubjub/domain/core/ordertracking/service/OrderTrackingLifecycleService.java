package io.github.dongyuns.jubjub.domain.core.ordertracking.service;

import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTracking;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTrackingStatus;
import io.github.dongyuns.jubjub.domain.core.ordertracking.repository.OrderTrackingRepository;
import io.github.dongyuns.jubjub.domain.core.member.repository.MemberProfileRepository;
import io.github.dongyuns.jubjub.domain.core.order.entity.Order;
import io.github.dongyuns.jubjub.domain.core.order.entity.OrderStatus;
import jakarta.persistence.EntityManager;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderTrackingLifecycleService {

    private final EntityManager entityManager;
    private final OrderTrackingRepository orderTrackingRepository;
    private final OrderTrackingSmsService orderTrackingSmsService;
    private final OrderTrackingNotificationService orderTrackingNotificationService;
    private final MemberProfileRepository memberProfileRepository;

    @Transactional
    public OrderTracking ensureTracking(Order order) {
        if (order.getStatus() != OrderStatus.PAID) {
            return null;
        }

        OrderTracking tracking = orderTrackingRepository.findByOrderId(order.getId())
                .orElseGet(() -> orderTrackingRepository.save(OrderTracking.initialize(order)));
        orderTrackingNotificationService.createIfNeeded(order, tracking);
        return tracking;
    }

    @Transactional
    @Scheduled(fixedDelayString = "${order-tracking.sync-delay-ms:60000}")
    public void synchronizePaidOrders() {
        List<Order> paidOrders = findPaidOrders();

        for (Order order : paidOrders) {
            OrderTracking tracking = ensureTracking(order);
            if (tracking == null) {
                continue;
            }

            sendNotificationIfNeeded(order, tracking);
        }
    }

    @Transactional
    public void notifyStatusChange(Order order, OrderTracking tracking) {
        sendNotificationIfNeeded(order, tracking);
    }

    private void sendNotificationIfNeeded(Order order, OrderTracking tracking) {
        if (!tracking.needsNotification()) {
            return;
        }

        orderTrackingNotificationService.createIfNeeded(order, tracking);
        if (tracking.getStatus() == OrderTrackingStatus.READY_FOR_PICKUP) {
            String phone = memberProfileRepository.findPhoneById(order.getMemberProfileId())
                    .orElseThrow(() -> new IllegalArgumentException("주문 회원의 전화번호를 찾을 수 없습니다."));
            orderTrackingSmsService.send(
                    phone,
                    buildMessage(order, tracking)
            );
        }
        tracking.markNotificationSent();
    }

    private String buildMessage(Order order, OrderTracking tracking) {
        String statusMessage = switch (tracking.getStatus()) {
            case RECEIVED -> "주문이 접수되었습니다.";
            case COOKING -> "매장에서 주문을 수락하고 조리를 시작했습니다.";
            case READY_FOR_PICKUP -> "픽업 준비가 완료되었습니다.";
            case PICKED_UP -> "주문이 픽업 완료되었습니다.";
            case REJECTED -> "매장에서 주문을 거절했습니다.";
        };

        StringBuilder builder = new StringBuilder("[줍줍] ")
                .append(order.getStore().getName())
                .append(" 주문 ")
                .append(order.getOrderNo())
                .append(" ")
                .append(statusMessage);

        if (tracking.getStatus() == OrderTrackingStatus.RECEIVED) {
            builder.append(" 예상 픽업시간: ")
                    .append(orderTrackingSmsService.formatPickupTime(tracking.getEstimatedPickupTime()));
        }

        return builder.toString();
    }

    @SuppressWarnings("unchecked")
    private List<Order> findPaidOrders() {
        return entityManager.createNativeQuery(
                        "select * from orders where status = :status",
                        Order.class
                )
                .setParameter("status", OrderStatus.PAID.name())
                .getResultList();
    }
}
