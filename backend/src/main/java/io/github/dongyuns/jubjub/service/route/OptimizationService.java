package io.github.dongyuns.jubjub.service.route;

import io.github.dongyuns.jubjub.dto.RouteOptimizeRequest;
import io.github.dongyuns.jubjub.dto.RouteOptimizeResponse;
import io.github.dongyuns.jubjub.entity.RouteLog;
import io.github.dongyuns.jubjub.entity.Store;
import io.github.dongyuns.jubjub.repository.RouteLogRepository;
import io.github.dongyuns.jubjub.repository.StoreRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OptimizationService {

    private final StoreRepository storeRepository;
    private final RouteLogRepository routeLogRepository;
    private final RouteTimeProvider routeTimeProvider;

    @Transactional
    public RouteOptimizeResponse optimize(RouteOptimizeRequest request) {
        Store store = storeRepository.findById(request.getStoreId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "가게를 찾을 수 없습니다. id=" + request.getStoreId()
                ));

        RouteTimeResult route = routeTimeProvider.getRouteTime(
                request.getUserLat(),
                request.getUserLng(),
                store.getLatitude(),
                store.getLongitude(),
                request.getTravelMode()
        );

        int foodPrepTimeMinutes = resolveFoodPrepTime(store);
        LocalDateTime now = LocalDateTime.now();

        int departureDelayMinutes = foodPrepTimeMinutes - route.getTravelTimeMinutes();

        boolean leaveNow;
        int recommendedDepartureDelayMinutes;
        LocalDateTime recommendedDepartureTime;

        if (departureDelayMinutes <= 0) {
            leaveNow = true;
            recommendedDepartureDelayMinutes = 0;
            recommendedDepartureTime = now;
        } else {
            leaveNow = false;
            recommendedDepartureDelayMinutes = departureDelayMinutes;
            recommendedDepartureTime = now.plusMinutes(departureDelayMinutes);
        }

        LocalDateTime expectedArrivalTime = recommendedDepartureTime.plusMinutes(route.getTravelTimeMinutes());

        RouteLog routeLog = RouteLog.builder()
                .storeId(store.getId())
                .userLat(request.getUserLat())
                .userLng(request.getUserLng())
                .storeLat(store.getLatitude())
                .storeLng(store.getLongitude())
                .travelMode(request.getTravelMode())
                .distanceKm(route.getDistanceKm())
                .travelTimeMinutes(route.getTravelTimeMinutes())
                .foodPrepTimeMinutes(foodPrepTimeMinutes)
                .leaveNow(leaveNow)
                .recommendedDepartureDelayMinutes(recommendedDepartureDelayMinutes)
                .recommendedDepartureTime(recommendedDepartureTime)
                .expectedArrivalTime(expectedArrivalTime)
                .createdAt(now)
                .build();

        routeLogRepository.save(routeLog);

        return RouteOptimizeResponse.builder()
                .storeId(store.getId())
                .storeName(store.getName())
                .travelMode(request.getTravelMode())
                .distanceKm(route.getDistanceKm())
                .travelTimeMinutes(route.getTravelTimeMinutes())
                .foodPrepTimeMinutes(foodPrepTimeMinutes)
                .leaveNow(leaveNow)
                .recommendedDepartureDelayMinutes(recommendedDepartureDelayMinutes)
                .recommendedDepartureTime(recommendedDepartureTime)
                .expectedArrivalTime(expectedArrivalTime)
                .message(buildMessage(leaveNow, recommendedDepartureDelayMinutes))
                .build();
    }

    private int resolveFoodPrepTime(Store store) {
        if (store.getAveragePrepMinutes() != null && store.getAveragePrepMinutes() > 0) {
            return store.getAveragePrepMinutes();
        }
        return 15;
    }

    private String buildMessage(boolean leaveNow, int delayMinutes) {
        if (leaveNow) {
            return "지금 바로 출발하는 것을 추천합니다.";
        }
        return delayMinutes + "분 뒤에 출발하는 것을 추천합니다.";
    }
}