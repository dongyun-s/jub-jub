package io.github.dongyuns.jubjub.domain.customer.ordertracking.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.core.order.entity.OrderStatus;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTrackingStatus;
import io.github.dongyuns.jubjub.domain.core.ordertracking.service.OrderTrackingQueryService;
import io.github.dongyuns.jubjub.domain.customer.ordertracking.dto.OrderDepartureRecommendationResponse;
import io.github.dongyuns.jubjub.domain.customer.ordertracking.dto.OrderTrackingResponse;
import io.github.dongyuns.jubjub.domain.customer.route.dto.TravelMode;
import io.github.dongyuns.jubjub.domain.shared.external.tmap.RouteTimeProvider;
import io.github.dongyuns.jubjub.domain.shared.external.tmap.RouteTimeResult;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderDepartureRecommendationServiceTest {

    @Mock private OrderTrackingQueryService orderTrackingQueryService;
    @Mock private RouteTimeProvider routeTimeProvider;

    private OrderDepartureRecommendationService service;

    @BeforeEach
    void setUp() {
        service = new OrderDepartureRecommendationService(orderTrackingQueryService, routeTimeProvider);
    }

    @Test
    void recommendsDepartureFromPickupReadyTimeAndTmapWalkingTime() {
        LocalDateTime readyAt = LocalDateTime.now().plusMinutes(25);
        when(orderTrackingQueryService.getMyTracking("customer@example.com", 8L))
                .thenReturn(tracking(OrderStatus.PAID, OrderTrackingStatus.COOKING, readyAt));
        when(routeTimeProvider.getRouteTime(37.5, 127.0, 37.6, 127.1, TravelMode.WALK))
                .thenReturn(RouteTimeResult.builder().travelTimeMinutes(10).build());

        OrderDepartureRecommendationResponse response = service.recommend(
                "customer@example.com", 8L, 37.5, 127.0
        );

        assertThat(response.estimatedPickupTime()).isEqualTo(readyAt);
        assertThat(response.walkingMinutes()).isEqualTo(10);
        assertThat(response.minutesUntilDeparture()).isBetween(14, 15);
        assertThat(response.expectedArrivalAt()).isEqualTo(response.recommendedDepartureAt().plusMinutes(10));
        assertThat(response.leaveNow()).isFalse();
        verify(routeTimeProvider).getRouteTime(37.5, 127.0, 37.6, 127.1, TravelMode.WALK);
    }

    @Test
    void leavesNowWhenWalkingTakesLongerThanTimeUntilPickup() {
        LocalDateTime now = LocalDateTime.of(2026, 9, 18, 15, 0);

        OrderDepartureRecommendationResponse response = OrderDepartureRecommendationService.calculate(
                8L, now.plusMinutes(5), 10, now
        );

        assertThat(response.minutesUntilDeparture()).isZero();
        assertThat(response.recommendedDepartureAt()).isEqualTo(now);
        assertThat(response.expectedArrivalAt()).isEqualTo(now.plusMinutes(10));
        assertThat(response.leaveNow()).isTrue();
    }

    @Test
    void roundsFractionalDepartureMinutesUp() {
        LocalDateTime now = LocalDateTime.of(2026, 9, 18, 15, 0, 30);

        OrderDepartureRecommendationResponse response = OrderDepartureRecommendationService.calculate(
                8L, LocalDateTime.of(2026, 9, 18, 15, 25), 10, now
        );

        assertThat(response.minutesUntilDeparture()).isEqualTo(15);
        assertThat(response.recommendedDepartureAt()).isEqualTo(now.plusMinutes(15));
    }

    @Test
    void rejectsCompletedOrderBeforeCallingTmap() {
        when(orderTrackingQueryService.getMyTracking("customer@example.com", 8L))
                .thenReturn(tracking(OrderStatus.COMPLETED, OrderTrackingStatus.PICKED_UP, LocalDateTime.now()));

        assertThatThrownBy(() -> service.recommend("customer@example.com", 8L, 37.5, 127.0))
                .isInstanceOf(BusinessException.class)
                .satisfies(exception -> assertThat(((BusinessException) exception).getStatus()).isEqualTo(HttpStatus.CONFLICT));
        verifyNoInteractions(routeTimeProvider);
    }

    @Test
    void rejectsInvalidCoordinatesBeforeCallingTmap() {
        when(orderTrackingQueryService.getMyTracking("customer@example.com", 8L))
                .thenReturn(tracking(OrderStatus.PAID, OrderTrackingStatus.RECEIVED, LocalDateTime.now()));

        assertThatThrownBy(() -> service.recommend("customer@example.com", 8L, 95.0, 127.0))
                .isInstanceOf(BusinessException.class)
                .satisfies(exception -> assertThat(((BusinessException) exception).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
        verifyNoInteractions(routeTimeProvider);
    }

    @Test
    void doesNotCallTmapWhenOrderIsNotOwnedByCustomer() {
        when(orderTrackingQueryService.getMyTracking("customer@example.com", 8L))
                .thenThrow(new BusinessException("ORDER_FORBIDDEN", "본인 주문만 조회할 수 있습니다.", HttpStatus.FORBIDDEN));

        assertThatThrownBy(() -> service.recommend("customer@example.com", 8L, 37.5, 127.0))
                .isInstanceOf(BusinessException.class)
                .satisfies(exception -> assertThat(((BusinessException) exception).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
        verifyNoInteractions(routeTimeProvider);
    }

    private OrderTrackingResponse tracking(
            OrderStatus orderStatus, OrderTrackingStatus trackingStatus, LocalDateTime readyAt
    ) {
        return new OrderTrackingResponse(
                8L, "ORD-8", orderStatus, trackingStatus, 10000,
                readyAt.minusMinutes(15), readyAt.minusMinutes(15), readyAt,
                "테스트 매장", "서울", 37.6, 127.1
        );
    }
}
