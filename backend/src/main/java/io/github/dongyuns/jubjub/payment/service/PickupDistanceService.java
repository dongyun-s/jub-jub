package io.github.dongyuns.jubjub.payment.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.route.dto.TravelMode;
import io.github.dongyuns.jubjub.domain.route.service.RouteTimeProvider;
import io.github.dongyuns.jubjub.domain.route.service.RouteTimeResult;
import io.github.dongyuns.jubjub.domain.store.entity.Store;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PickupDistanceService {

    private final RouteTimeProvider routeTimeProvider;

    public int calculatePickupDistanceMeters(double userLatitude, double userLongitude, Store store) {
        validateCoordinate(userLatitude, userLongitude);

        if (store.getLatitude() == null || store.getLongitude() == null) {
            throw new BusinessException("STORE_COORDINATE_MISSING", "매장 위치 정보가 없습니다.", HttpStatus.CONFLICT);
        }

        RouteTimeResult route = routeTimeProvider.getRouteTime(
                userLatitude,
                userLongitude,
                store.getLatitude(),
                store.getLongitude(),
                TravelMode.WALK
        );

        if (route.getDistanceMeters() <= 0) {
            throw new BusinessException("INVALID_PICKUP_DISTANCE", "픽업 이동 거리를 계산할 수 없습니다.", HttpStatus.BAD_GATEWAY);
        }

        return route.getDistanceMeters();
    }

    private void validateCoordinate(double latitude, double longitude) {
        if (latitude < -90 || latitude > 90) {
            throw new BusinessException("INVALID_LATITUDE", "위도 값이 올바르지 않습니다.", HttpStatus.BAD_REQUEST);
        }
        if (longitude < -180 || longitude > 180) {
            throw new BusinessException("INVALID_LONGITUDE", "경도 값이 올바르지 않습니다.", HttpStatus.BAD_REQUEST);
        }
    }
}
