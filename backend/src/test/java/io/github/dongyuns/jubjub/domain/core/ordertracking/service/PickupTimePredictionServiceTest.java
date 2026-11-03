package io.github.dongyuns.jubjub.domain.core.ordertracking.service;

import io.github.dongyuns.jubjub.domain.core.order.entity.Order;
import io.github.dongyuns.jubjub.domain.core.order.entity.OrderItem;
import io.github.dongyuns.jubjub.domain.core.order.entity.OrderStatus;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTrackingStatus;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.PredictionSource;
import io.github.dongyuns.jubjub.domain.core.ordertracking.repository.OrderTrackingRepository;
import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.shared.external.ai.AiClient;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClientException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PickupTimePredictionServiceTest {

    @Mock private OrderTrackingRepository orderTrackingRepository;
    @Mock private AiClient aiClient;
    @Mock private Order order;
    @Mock private OrderItem item;
    @Mock private Store store;

    private PickupTimePredictionService service;
    private final LocalDateTime paidAt = LocalDateTime.of(2026, 9, 18, 12, 0);

    @BeforeEach
    void setUp() {
        service = new PickupTimePredictionService(orderTrackingRepository, aiClient);
        when(order.getStore()).thenReturn(store);
        when(store.getCookingTimeMinutes()).thenReturn(15);
        when(order.getStoreId()).thenReturn(1L);
        when(order.getId()).thenReturn(100L);
        when(order.getItems()).thenReturn(List.of(item));
        when(item.getMenuId()).thenReturn(5L);
        when(item.getQuantity()).thenReturn(2);
    }

    @Test
    void predictsUsingSameStoreWaitingOrdersAndOrderItems() {
        givenEarlierOrders(3);
        when(aiClient.predictPickupMinutes(
                eq(1L), eq(15), eq(List.of(new AiClient.PickupItem(5L, 2))), eq(3L),
                eq(paidAt.atOffset(ZoneOffset.ofHours(9)))
        )).thenReturn(26);

        assertThat(service.predictReadyAt(order)).isEqualTo(paidAt.plusMinutes(26));
        verify(orderTrackingRepository).countEarlierActiveOrders(
                1L, 100L, paidAt, OrderStatus.PAID,
                List.of(OrderTrackingStatus.RECEIVED, OrderTrackingStatus.COOKING));
    }

    @Test
    void acceptanceIgnoresOlderUnacceptedOrders() {
        LocalDateTime acceptedAt = LocalDateTime.of(2026, 9, 18, 15, 50);
        when(aiClient.predictPickupMinutes(
                eq(1L), eq(15), anyList(), eq(0L),
                eq(acceptedAt.atOffset(ZoneOffset.ofHours(9)))
        )).thenReturn(15);

        assertThat(service.predictReadyAtOnAcceptance(order, acceptedAt)).isEqualTo(acceptedAt.plusMinutes(15));
        verify(orderTrackingRepository).countCookingOrders(1L, 100L, OrderStatus.PAID, OrderTrackingStatus.COOKING);
        verify(orderTrackingRepository, never()).countEarlierActiveOrders(
                eq(1L), eq(100L), eq(paidAt), eq(OrderStatus.PAID), anyList());
    }

    @Test
    void acceptanceIncludesOtherCookingOrdersRegardlessOfPaymentOrder() {
        LocalDateTime acceptedAt = LocalDateTime.of(2026, 9, 18, 15, 51);
        when(orderTrackingRepository.countCookingOrders(1L, 100L, OrderStatus.PAID, OrderTrackingStatus.COOKING))
                .thenReturn(1L);
        when(aiClient.predictPickupMinutes(
                eq(1L), eq(15), anyList(), eq(1L),
                eq(acceptedAt.atOffset(ZoneOffset.ofHours(9)))
        )).thenReturn(18);

        assertThat(service.predictReadyAtOnAcceptance(order, acceptedAt)).isEqualTo(acceptedAt.plusMinutes(18));
    }

    @Test
    void returnsFeaturesNeededForTrainingData() {
        LocalDateTime acceptedAt = LocalDateTime.of(2026, 9, 18, 18, 10);
        when(orderTrackingRepository.countCookingOrders(1L, 100L, OrderStatus.PAID, OrderTrackingStatus.COOKING))
                .thenReturn(2L);
        when(aiClient.predictPickupMinutes(eq(1L), eq(15), anyList(), eq(2L),
                eq(acceptedAt.atOffset(ZoneOffset.ofHours(9)))))
                .thenReturn(23);

        PickupTimePredictionService.PredictionResult result = service.predictOnAcceptance(order, acceptedAt);

        assertThat(result.estimatedReadyAt()).isEqualTo(acceptedAt.plusMinutes(23));
        assertThat(result.totalItemQuantity()).isEqualTo(2);
        assertThat(result.distinctMenuCount()).isEqualTo(1);
        assertThat(result.waitingOrderCount()).isEqualTo(2);
        assertThat(result.source()).isEqualTo(PredictionSource.FASTAPI);
    }

    @Test
    void usesStoreCookingTimeWhenAiIsUnavailable() {
        givenEarlierOrders(3);
        when(aiClient.predictPickupMinutes(eq(1L), eq(15), anyList(), eq(3L),
                eq(paidAt.atOffset(ZoneOffset.ofHours(9)))))
                .thenThrow(new RestClientException("connection refused"));

        assertThat(service.predictReadyAt(order)).isEqualTo(paidAt.plusMinutes(15));
    }

    private void givenEarlierOrders(long count) {
        when(order.getPaidAt()).thenReturn(paidAt);
        when(orderTrackingRepository.countEarlierActiveOrders(
                1L, 100L, paidAt, OrderStatus.PAID,
                List.of(OrderTrackingStatus.RECEIVED, OrderTrackingStatus.COOKING)))
                .thenReturn(count);
    }
}
