package io.github.dongyuns.jubjub.domain.core.payment.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.shared.external.tmap.RouteTimeProvider;
import io.github.dongyuns.jubjub.domain.shared.external.tmap.RouteTimeResult;
import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PickupDistanceServiceTest {

    @Mock
    private RouteTimeProvider routeTimeProvider;

    private PickupDistanceService pickupDistanceService;

    @BeforeEach
    void setUp() {
        pickupDistanceService = new PickupDistanceService(routeTimeProvider);
    }

    @Test
    void returnsTmapWalkingDistanceInMeters() {
        Store store = createStore(37.4980, 127.0276);
        when(routeTimeProvider.getRouteTime(anyDouble(), anyDouble(), anyDouble(), anyDouble(), any()))
                .thenReturn(RouteTimeResult.builder()
                        .distanceMeters(1840)
                        .distanceKm(1.84)
                        .travelTimeMinutes(22)
                        .build());

        int distanceMeters = pickupDistanceService.calculatePickupDistanceMeters(37.5572, 126.9245, store);

        assertThat(distanceMeters).isEqualTo(1840);
    }

    @Test
    void throwsWhenCoordinateIsInvalid() {
        Store store = createStore(37.4980, 127.0276);

        assertThatThrownBy(() -> pickupDistanceService.calculatePickupDistanceMeters(95.0, 127.0, store))
                .isInstanceOf(BusinessException.class)
                .hasMessage("위도 값이 올바르지 않습니다.");
    }

    private Store createStore(double latitude, double longitude) {
        return Store.builder()
                .ownerProfileId(1L)
                .categoryId(1)
                .name("테스트 매장")
                .address("서울시 강남구")
                .phoneNumber("02-0000-0000")
                .latitude(latitude)
                .longitude(longitude)
                .cookingTimeMinutes(15)
                .status("OPEN")
                .originInfo("원산지")
                .minOrderAmount(10000)
                .build();
    }
}
