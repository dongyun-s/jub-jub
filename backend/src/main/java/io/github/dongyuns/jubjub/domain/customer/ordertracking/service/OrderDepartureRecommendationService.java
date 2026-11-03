package io.github.dongyuns.jubjub.domain.customer.ordertracking.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.core.order.entity.OrderStatus;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTrackingStatus;
import io.github.dongyuns.jubjub.domain.core.ordertracking.service.OrderTrackingQueryService;
import io.github.dongyuns.jubjub.domain.customer.ordertracking.dto.OrderDepartureRecommendationResponse;
import io.github.dongyuns.jubjub.domain.customer.ordertracking.dto.OrderTrackingResponse;
import io.github.dongyuns.jubjub.domain.customer.route.dto.TravelMode;
import io.github.dongyuns.jubjub.domain.shared.external.tmap.RouteTimeProvider;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OrderDepartureRecommendationService {

    private static final ZoneId KOREA_ZONE = ZoneId.of("Asia/Seoul");

    private final OrderTrackingQueryService orderTrackingQueryService;
    private final RouteTimeProvider routeTimeProvider;

    public OrderDepartureRecommendationResponse recommend(
            String accountEmail, Long orderId, double userLat, double userLng
    ) {
        // 기존 주문 추적 조회에서 본인 주문 여부를 검증한다.
        OrderTrackingResponse tracking = orderTrackingQueryService.getMyTracking(accountEmail, orderId);
        if (tracking.paymentOrderStatus() != OrderStatus.PAID
                || tracking.trackingStatus() == null
                || tracking.trackingStatus() == OrderTrackingStatus.PICKED_UP
                || tracking.trackingStatus() == OrderTrackingStatus.REJECTED) {
            throw new BusinessException("DEPARTURE_NOT_AVAILABLE", "진행 중인 결제 완료 주문만 출발 시간을 추천할 수 있습니다.", HttpStatus.CONFLICT);
        }
        validateCoordinates(userLat, userLng);
        if (tracking.storeLatitude() == null || tracking.storeLongitude() == null) {
            throw new BusinessException("STORE_COORDINATE_MISSING", "매장 위치 정보가 없습니다.", HttpStatus.CONFLICT);
        }

        int walkingMinutes = routeTimeProvider.getRouteTime(
                userLat, userLng,
                tracking.storeLatitude(), tracking.storeLongitude(),
                TravelMode.WALK
        ).getTravelTimeMinutes();
        if (walkingMinutes <= 0) {
            throw new BusinessException("WALKING_TIME_UNAVAILABLE", "도보 이동시간을 계산할 수 없습니다.", HttpStatus.BAD_GATEWAY);
        }

        return calculate(orderId, tracking.estimatedPickupTime(), walkingMinutes, LocalDateTime.now(KOREA_ZONE));
    }

    static OrderDepartureRecommendationResponse calculate(
            Long orderId, LocalDateTime estimatedPickupTime, int walkingMinutes, LocalDateTime now
    ) {
        // 남은 시간이 도보시간보다 짧으면 즉시 출발하고, 아니면 분 단위로 올림해 안내한다.
        LocalDateTime idealDepartureAt = estimatedPickupTime.minusMinutes(walkingMinutes);
        long delayMillis = Math.max(0L, Duration.between(now, idealDepartureAt).toMillis());
        int minutesUntilDeparture = Math.toIntExact((delayMillis + 59_999L) / 60_000L);
        LocalDateTime recommendedDepartureAt = now.plusMinutes(minutesUntilDeparture);
        return new OrderDepartureRecommendationResponse(
                orderId,
                estimatedPickupTime,
                walkingMinutes,
                minutesUntilDeparture,
                recommendedDepartureAt,
                recommendedDepartureAt.plusMinutes(walkingMinutes),
                minutesUntilDeparture == 0
        );
    }

    private void validateCoordinates(double latitude, double longitude) {
        if (!Double.isFinite(latitude) || latitude < -90 || latitude > 90
                || !Double.isFinite(longitude) || longitude < -180 || longitude > 180) {
            throw new BusinessException("INVALID_LOCATION", "현재 위치의 위도 또는 경도가 올바르지 않습니다.", HttpStatus.BAD_REQUEST);
        }
    }
}
