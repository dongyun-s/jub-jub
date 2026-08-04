package io.github.dongyuns.jubjub.domain.owner.order.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.core.order.entity.Order;
import io.github.dongyuns.jubjub.domain.core.order.entity.OrderStatus;
import io.github.dongyuns.jubjub.domain.core.order.repository.OrderRepository;
import io.github.dongyuns.jubjub.domain.core.order.service.OrderService;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTracking;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTrackingStatus;
import io.github.dongyuns.jubjub.domain.core.ordertracking.repository.OrderTrackingRepository;
import io.github.dongyuns.jubjub.domain.core.ordertracking.service.OrderTrackingLifecycleService;
import io.github.dongyuns.jubjub.domain.core.payment.service.PaymentService;
import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.owner.order.dto.OwnerOrderDetailResponse;
import io.github.dongyuns.jubjub.domain.owner.order.dto.OwnerOrderListResponse;
import io.github.dongyuns.jubjub.domain.owner.order.dto.OwnerOrderStatusResponse;
import io.github.dongyuns.jubjub.domain.owner.store.service.OwnerStoreResolver;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OwnerOrderService {

    private static final List<OrderStatus> POS_ORDER_STATUSES = List.of(
            OrderStatus.PAID,
            OrderStatus.COMPLETED,
            OrderStatus.REFUNDED
    );

    private final OwnerStoreResolver ownerStoreResolver;
    private final OrderRepository orderRepository;
    private final OrderTrackingRepository orderTrackingRepository;
    private final OrderTrackingLifecycleService orderTrackingLifecycleService;
    private final PaymentService paymentService;
    private final OrderService orderService;

    @Transactional
    public List<OwnerOrderListResponse> getOrders(String accountEmail, OrderTrackingStatus trackingStatus) {
        Store store = ownerStoreResolver.getCurrentOwnerStore(accountEmail);
        List<Order> orders = orderRepository.findAllByStore_IdAndStatusInOrderByCreatedAtDesc(
                store.getId(),
                POS_ORDER_STATUSES
        );
        if (orders.isEmpty()) {
            return List.of();
        }

        List<Long> orderIds = orders.stream().map(Order::getId).toList();
        Map<Long, OrderTracking> trackingByOrderId = new HashMap<>();
        orderTrackingRepository.findAllByOrderIdIn(orderIds)
                .forEach(tracking -> trackingByOrderId.put(tracking.getOrderId(), tracking));

        for (Order order : orders) {
            if (order.getStatus() == OrderStatus.PAID && !trackingByOrderId.containsKey(order.getId())) {
                OrderTracking tracking = orderTrackingLifecycleService.ensureTracking(order);
                if (tracking != null) {
                    trackingByOrderId.put(order.getId(), tracking);
                }
            }
        }

        return orders.stream()
                .filter(order -> trackingStatus == null
                        || (trackingByOrderId.get(order.getId()) != null
                        && trackingByOrderId.get(order.getId()).getStatus() == trackingStatus))
                .map(order -> OwnerOrderListResponse.from(order, trackingByOrderId.get(order.getId())))
                .toList();
    }

    @Transactional
    public OwnerOrderDetailResponse getOrder(String accountEmail, Long orderId) {
        Order order = getOwnedOrder(accountEmail, orderId);
        OrderTracking tracking = getTracking(order);
        return OwnerOrderDetailResponse.from(order, tracking);
    }

    @Transactional
    public OwnerOrderStatusResponse accept(String accountEmail, Long orderId) {
        Order order = getPaidOwnedOrder(accountEmail, orderId);
        OrderTracking tracking = getTrackingForUpdate(order);
        transition(() -> tracking.acceptAndStartCooking(
                LocalDateTime.now(),
                order.getStore().getCookingTimeMinutes()
        ));
        orderTrackingLifecycleService.notifyStatusChange(order, tracking);
        return OwnerOrderStatusResponse.from(order, tracking);
    }

    @Transactional
    public OwnerOrderStatusResponse markReady(String accountEmail, Long orderId) {
        Order order = getPaidOwnedOrder(accountEmail, orderId);
        OrderTracking tracking = getTrackingForUpdate(order);
        transition(() -> tracking.markReadyForPickup(LocalDateTime.now()));
        orderTrackingLifecycleService.notifyStatusChange(order, tracking);
        return OwnerOrderStatusResponse.from(order, tracking);
    }

    @Transactional
    public OwnerOrderStatusResponse complete(String accountEmail, Long orderId) {
        Order order = getPaidOwnedOrder(accountEmail, orderId);
        OrderTracking tracking = getTrackingForUpdate(order);
        validateTrackingStatus(tracking, OrderTrackingStatus.READY_FOR_PICKUP);
        orderService.completePickup(orderId);
        transition(tracking::completePickup);
        orderTrackingLifecycleService.notifyStatusChange(order, tracking);
        return OwnerOrderStatusResponse.from(order, tracking);
    }

    @Transactional
    public OwnerOrderStatusResponse reject(String accountEmail, Long orderId, String reason) {
        Order order = getPaidOwnedOrder(accountEmail, orderId);
        OrderTracking tracking = getTrackingForUpdate(order);
        validateTrackingStatus(tracking, OrderTrackingStatus.RECEIVED);
        paymentService.refundPaidOrder(orderId, reason);
        transition(tracking::reject);
        orderTrackingLifecycleService.notifyStatusChange(order, tracking);
        return OwnerOrderStatusResponse.from(order, tracking);
    }

    private Order getPaidOwnedOrder(String accountEmail, Long orderId) {
        Order order = getOwnedOrder(accountEmail, orderId);
        if (order.getStatus() != OrderStatus.PAID) {
            throw new BusinessException("OWNER_ORDER_NOT_PROCESSABLE", "결제 완료 상태의 주문만 처리할 수 있습니다.", HttpStatus.CONFLICT);
        }
        return order;
    }

    private Order getOwnedOrder(String accountEmail, Long orderId) {
        Store store = ownerStoreResolver.getCurrentOwnerStore(accountEmail);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("ORDER_NOT_FOUND", "주문을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        if (!order.getStoreId().equals(store.getId())) {
            throw new BusinessException("OWNER_ORDER_FORBIDDEN", "해당 매장의 주문만 조회하고 처리할 수 있습니다.", HttpStatus.FORBIDDEN);
        }
        return order;
    }

    private OrderTracking getTracking(Order order) {
        return orderTrackingRepository.findByOrderId(order.getId())
                .orElseGet(() -> order.getStatus() == OrderStatus.PAID
                        ? orderTrackingLifecycleService.ensureTracking(order)
                        : null);
    }

    private OrderTracking getTrackingForUpdate(Order order) {
        return orderTrackingRepository.findByOrderIdForUpdate(order.getId())
                .orElseGet(() -> {
                    OrderTracking tracking = getTracking(order);
                    if (tracking == null) {
                        throw new BusinessException(
                                "ORDER_TRACKING_NOT_FOUND",
                                "결제 완료 주문의 진행 정보를 찾을 수 없습니다.",
                                HttpStatus.NOT_FOUND
                        );
                    }
                    return tracking;
                });
    }

    private void validateTrackingStatus(OrderTracking tracking, OrderTrackingStatus expected) {
        if (tracking.getStatus() != expected) {
            throw invalidTransition(tracking.getStatus());
        }
    }

    private void transition(Runnable transition) {
        try {
            transition.run();
        } catch (IllegalStateException exception) {
            throw invalidTransitionMessage(exception.getMessage());
        }
    }

    private BusinessException invalidTransition(OrderTrackingStatus current) {
        return invalidTransitionMessage("현재 주문 진행 상태: " + current);
    }

    private BusinessException invalidTransitionMessage(String message) {
        return new BusinessException("INVALID_ORDER_TRACKING_TRANSITION", message, HttpStatus.CONFLICT);
    }
}
