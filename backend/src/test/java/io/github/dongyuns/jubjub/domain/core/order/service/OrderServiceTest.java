package io.github.dongyuns.jubjub.domain.core.order.service;

import io.github.dongyuns.jubjub.domain.core.account.entity.Account;
import io.github.dongyuns.jubjub.domain.core.account.repository.AccountRepository;
import io.github.dongyuns.jubjub.domain.core.cart.repository.CartRepository;
import io.github.dongyuns.jubjub.domain.core.reward.event.PickupCompletedEvent;
import io.github.dongyuns.jubjub.domain.core.reward.service.RewardService;
import io.github.dongyuns.jubjub.domain.core.coupon.service.DiscountCalculatorService;
import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.core.store.repository.StoreRepository;
import io.github.dongyuns.jubjub.domain.core.member.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.core.member.repository.MemberProfileRepository;
import io.github.dongyuns.jubjub.domain.core.order.entity.Order;
import io.github.dongyuns.jubjub.domain.core.order.entity.OrderStatus;
import io.github.dongyuns.jubjub.domain.core.order.repository.OrderRepository;
import io.github.dongyuns.jubjub.domain.core.payment.repository.PaymentRepository;
import io.github.dongyuns.jubjub.domain.core.payment.service.PickupDistanceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.inOrder;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private CartRepository cartRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private MemberProfileRepository memberProfileRepository;
    @Mock private StoreRepository storeRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private DiscountCalculatorService discountCalculatorService;
    @Mock private PickupDistanceService pickupDistanceService;
    @Mock private RewardService rewardService;
    @Mock private ApplicationEventPublisher eventPublisher;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(
                orderRepository,
                cartRepository,
                accountRepository,
                memberProfileRepository,
                storeRepository,
                paymentRepository,
                discountCalculatorService,
                pickupDistanceService,
                rewardService,
                eventPublisher
        );
    }

    @Test
    void publishesPickupCompletedEventWithCalculatedDistance() {
        Order order = createPaidOrder();
        when(orderRepository.findById(101L)).thenReturn(Optional.of(order));
        when(pickupDistanceService.calculatePickupDistanceMeters(37.5572, 126.9245, order.getStore())).thenReturn(1730);
        when(rewardService.givePickupReward(order.getMemberProfile(), 100, 1730, 101L))
                .thenReturn(new RewardService.PickupRewardResult(7L, true, 1));

        orderService.completePickup(101L);

        ArgumentCaptor<PickupCompletedEvent> eventCaptor = ArgumentCaptor.forClass(PickupCompletedEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        InOrder calls = inOrder(rewardService, eventPublisher);
        calls.verify(rewardService).givePickupReward(order.getMemberProfile(), 100, 1730, 101L);
        calls.verify(eventPublisher).publishEvent(org.mockito.ArgumentMatchers.any(PickupCompletedEvent.class));

        PickupCompletedEvent event = eventCaptor.getValue();
        assertThat(event.getMemberProfileId()).isEqualTo(7L);
        assertThat(event.isTierUpgraded()).isTrue();
        assertThat(event.getDistanceCouponCount()).isEqualTo(1);
        assertThat(event.getOrderId()).isEqualTo(101L);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.COMPLETED);
    }

    @Test
    void rewardFailureDoesNotPublishCouponEvent() {
        Order order = createPaidOrder();
        when(orderRepository.findById(101L)).thenReturn(Optional.of(order));
        when(pickupDistanceService.calculatePickupDistanceMeters(37.5572, 126.9245, order.getStore())).thenReturn(1730);
        when(rewardService.givePickupReward(order.getMemberProfile(), 100, 1730, 101L))
                .thenThrow(new IllegalStateException("reward failed"));

        assertThatThrownBy(() -> orderService.completePickup(101L))
                .isInstanceOf(IllegalStateException.class);
        verify(eventPublisher, never()).publishEvent(org.mockito.ArgumentMatchers.any(PickupCompletedEvent.class));
    }

    private Order createPaidOrder() {
        Account account = Account.builder()
                .email("user@example.com")
                .password("password")
                .build();

        MemberProfile memberProfile = MemberProfile.builder()
                .account(account)
                .name("테스트 사용자")
                .phone("01012345678")
                .nickname("사용자")
                .pointBalance(0)
                .build();

        Store store = Store.builder()
                .ownerProfileId(1L)
                .categoryId(1)
                .name("테스트 매장")
                .address("서울시 강남구")
                .phoneNumber("02-0000-0000")
                .latitude(37.4980)
                .longitude(127.0276)
                .cookingTimeMinutes(15)
                .status("OPEN")
                .originInfo("원산지")
                .minOrderAmount(10000)
                .build();

        Order order = Order.ready(
                memberProfile,
                store,
                "ORD-101",
                15000,
                0,
                0,
                0,
                15000,
                false,
                37.5572,
                126.9245,
                List.of()
        );
        order.markPaid(LocalDateTime.now());
        setField(order, "id", 101L);
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
