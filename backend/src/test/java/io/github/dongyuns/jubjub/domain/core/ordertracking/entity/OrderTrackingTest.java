package io.github.dongyuns.jubjub.domain.core.ordertracking.entity;

import io.github.dongyuns.jubjub.domain.core.account.entity.Account;
import io.github.dongyuns.jubjub.domain.core.member.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.core.order.entity.Order;
import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OrderTrackingTest {

    @Test
    void progressesOnlyThroughOwnerPosSequence() {
        OrderTracking tracking = OrderTracking.initialize(createPaidOrder());
        LocalDateTime now = LocalDateTime.now();

        tracking.acceptAndStartCooking(now, 15);
        assertThat(tracking.getStatus()).isEqualTo(OrderTrackingStatus.COOKING);
        assertThat(tracking.getEstimatedPickupTime()).isEqualTo(now.plusMinutes(15));

        tracking.markReadyForPickup(now.plusMinutes(10));
        assertThat(tracking.getStatus()).isEqualTo(OrderTrackingStatus.READY_FOR_PICKUP);

        tracking.completePickup();
        assertThat(tracking.getStatus()).isEqualTo(OrderTrackingStatus.PICKED_UP);
    }

    @Test
    void rejectsOnlyReceivedOrder() {
        OrderTracking tracking = OrderTracking.initialize(createPaidOrder());

        tracking.reject();

        assertThat(tracking.getStatus()).isEqualTo(OrderTrackingStatus.REJECTED);
        assertThatThrownBy(() -> tracking.acceptAndStartCooking(LocalDateTime.now(), 15))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void preventsSkippingRequiredStatus() {
        OrderTracking tracking = OrderTracking.initialize(createPaidOrder());

        assertThatThrownBy(() -> tracking.markReadyForPickup(LocalDateTime.now()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("RECEIVED");
    }

    private Order createPaidOrder() {
        Account account = Account.builder()
                .email("customer@example.com")
                .password("password")
                .build();
        MemberProfile profile = MemberProfile.builder()
                .account(account)
                .name("고객")
                .phone("01011112222")
                .nickname("고객")
                .build();
        Store store = Store.builder()
                .ownerProfileId(10L)
                .name("테스트 매장")
                .cookingTimeMinutes(15)
                .build();
        Order order = Order.ready(
                profile,
                store,
                "ORD-1",
                10000,
                0,
                0,
                0,
                10000,
                false,
                null,
                null,
                List.of()
        );
        order.markPaid(LocalDateTime.now());
        setField(order, "id", 1L);
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
