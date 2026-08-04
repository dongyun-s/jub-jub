package io.github.dongyuns.jubjub.domain.owner.order.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.core.account.entity.Account;
import io.github.dongyuns.jubjub.domain.core.member.entity.MemberProfile;
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
import io.github.dongyuns.jubjub.domain.owner.order.dto.OwnerOrderStatusResponse;
import io.github.dongyuns.jubjub.domain.owner.store.service.OwnerStoreResolver;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OwnerOrderServiceTest {

    @Mock private OwnerStoreResolver ownerStoreResolver;
    @Mock private OrderRepository orderRepository;
    @Mock private OrderTrackingRepository orderTrackingRepository;
    @Mock private OrderTrackingLifecycleService orderTrackingLifecycleService;
    @Mock private PaymentService paymentService;
    @Mock private OrderService orderService;

    private OwnerOrderService ownerOrderService;

    @BeforeEach
    void setUp() {
        ownerOrderService = new OwnerOrderService(
                ownerStoreResolver,
                orderRepository,
                orderTrackingRepository,
                orderTrackingLifecycleService,
                paymentService,
                orderService
        );
    }

    @Test
    void acceptsOrderOwnedByCurrentStore() {
        Store store = store(1L, 10L);
        Order order = paidOrder(100L, store);
        OrderTracking tracking = OrderTracking.initialize(order);
        mockOwnedOrder(store, order, tracking);

        OwnerOrderStatusResponse response = ownerOrderService.accept("owner@example.com", 100L);

        assertThat(response.trackingStatus()).isEqualTo(OrderTrackingStatus.COOKING);
        verify(orderTrackingLifecycleService).notifyStatusChange(order, tracking);
    }

    @Test
    void rejectsOtherStoreOrder() {
        Store ownerStore = store(1L, 10L);
        Store otherStore = store(2L, 20L);
        Order order = paidOrder(100L, otherStore);
        when(ownerStoreResolver.getCurrentOwnerStore("owner@example.com")).thenReturn(ownerStore);
        when(orderRepository.findById(100L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> ownerOrderService.accept("owner@example.com", 100L))
                .isInstanceOf(BusinessException.class)
                .extracting("code")
                .isEqualTo("OWNER_ORDER_FORBIDDEN");
        verify(paymentService, never()).refundPaidOrder(100L, "재료 소진");
    }

    @Test
    void refundsPaymentWhenReceivedOrderIsRejected() {
        Store store = store(1L, 10L);
        Order order = paidOrder(100L, store);
        OrderTracking tracking = OrderTracking.initialize(order);
        mockOwnedOrder(store, order, tracking);
        doAnswer(invocation -> {
            order.markRefunded();
            return null;
        }).when(paymentService).refundPaidOrder(100L, "재료 소진");

        OwnerOrderStatusResponse response = ownerOrderService.reject("owner@example.com", 100L, "재료 소진");

        assertThat(response.orderStatus()).isEqualTo(OrderStatus.REFUNDED);
        assertThat(response.trackingStatus()).isEqualTo(OrderTrackingStatus.REJECTED);
        verify(paymentService).refundPaidOrder(100L, "재료 소진");
        verify(orderTrackingLifecycleService).notifyStatusChange(order, tracking);
    }

    private void mockOwnedOrder(Store store, Order order, OrderTracking tracking) {
        when(ownerStoreResolver.getCurrentOwnerStore("owner@example.com")).thenReturn(store);
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(orderTrackingRepository.findByOrderIdForUpdate(order.getId())).thenReturn(Optional.of(tracking));
    }

    private Store store(Long storeId, Long ownerProfileId) {
        Store store = Store.builder()
                .ownerProfileId(ownerProfileId)
                .name("테스트 매장")
                .latitude(37.5)
                .longitude(127.0)
                .cookingTimeMinutes(15)
                .build();
        setField(store, "id", storeId);
        return store;
    }

    private Order paidOrder(Long orderId, Store store) {
        Account account = Account.builder()
                .email("customer@example.com")
                .password("password")
                .build();
        MemberProfile profile = MemberProfile.builder()
                .account(account)
                .name("고객")
                .phone("01055556666")
                .nickname("고객")
                .build();
        Order order = Order.ready(
                profile,
                store,
                "ORD-" + orderId,
                12000,
                0,
                0,
                0,
                12000,
                false,
                37.6,
                127.1,
                List.of()
        );
        order.markPaid(LocalDateTime.now());
        setField(order, "id", orderId);
        return order;
    }

    private void setField(Object target, String fieldName, Object value) {
        try {
            java.lang.reflect.Field field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException exception) {
            throw new IllegalStateException(fieldName + " 필드 설정에 실패했습니다.", exception);
        }
    }
}
