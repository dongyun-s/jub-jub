package io.github.dongyuns.jubjub.domain.shared.external.tmap;

import io.github.dongyuns.jubjub.domain.shared.external.tmap.TmapProperties;
import io.github.dongyuns.jubjub.domain.customer.route.dto.TravelMode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class TmapRouteTimeProvider implements RouteTimeProvider {

    private final WebClient webClient;
    private final TmapProperties properties;

    @Override
    public RouteTimeResult getRouteTime(
            double startLat,
            double startLng,
            double endLat,
            double endLng,
            TravelMode travelMode
    ) {
        log.info("TMAP 보행자 경로 호출 시작");
        log.info("url={}", properties.getPedestrianUrl());
        log.info("appKey exists={}", properties.getAppKey() != null && !properties.getAppKey().isBlank());
        log.info("start=({}, {}), end=({}, {}), mode={}", startLat, startLng, endLat, endLng, travelMode);

        Map<String, Object> body = new HashMap<>();
        body.put("startX", String.valueOf(startLng));   // 경도
        body.put("startY", String.valueOf(startLat));   // 위도
        body.put("endX", String.valueOf(endLng));       // 경도
        body.put("endY", String.valueOf(endLat));       // 위도
        body.put("reqCoordType", "WGS84GEO");
        body.put("resCoordType", "WGS84GEO");
        body.put("startName", "출발지");
        body.put("endName", "도착지");

        log.info("🔥 TMAP 요청 바디={}", body);

        try {
            Map<String, Object> response = webClient.post()
                    .uri(properties.getPedestrianUrl())
                    .header("appKey", properties.getAppKey())
                    .header(HttpHeaders.CONTENT_TYPE, "application/json")
                    .bodyValue(body)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, clientResponse ->
                            clientResponse.bodyToMono(String.class)
                                    .map(errorBody -> new IllegalStateException("TMAP API 호출 실패: " + errorBody))
                    )
                    .bodyToMono(Map.class)
                    .block();

            log.info("🔥 TMAP 응답={}", response);

            if (response == null || response.isEmpty()) {
                throw new IllegalStateException("TMAP API 응답이 비어 있습니다.");
            }

            int totalDistanceMeters = extractTotalDistance(response);
            int totalTimeSeconds = extractTotalTime(response);

            if (totalDistanceMeters <= 0 || totalTimeSeconds <= 0) {
                throw new IllegalStateException("TMAP API 응답에서 거리 또는 시간이 올바르지 않습니다.");
            }

            double distanceKm = round2(totalDistanceMeters / 1000.0);
            int travelTimeMinutes = convertTravelTimeMinutes(totalTimeSeconds, travelMode);

            return RouteTimeResult.builder()
                    .distanceMeters(totalDistanceMeters)
                    .distanceKm(distanceKm)
                    .travelTimeMinutes(travelTimeMinutes)
                    .build();

        } catch (Exception e) {
            log.error("TMAP 호출 실패", e);
            throw e;
        }
    }

    private int extractTotalDistance(Map<String, Object> response) {
        List<Map<String, Object>> features = (List<Map<String, Object>>) response.get("features");
        if (features == null || features.isEmpty()) {
            throw new IllegalStateException("TMAP API 응답에 features가 없습니다.");
        }

        Map<String, Object> firstFeature = features.get(0);
        Map<String, Object> propertiesMap = (Map<String, Object>) firstFeature.get("properties");
        if (propertiesMap == null) {
            throw new IllegalStateException("TMAP API 응답에 properties가 없습니다.");
        }

        Object totalDistance = propertiesMap.get("totalDistance");
        if (totalDistance == null) {
            throw new IllegalStateException("TMAP API 응답에 totalDistance가 없습니다.");
        }

        return ((Number) totalDistance).intValue();
    }

    private int extractTotalTime(Map<String, Object> response) {
        List<Map<String, Object>> features = (List<Map<String, Object>>) response.get("features");
        if (features == null || features.isEmpty()) {
            throw new IllegalStateException("TMAP API 응답에 features가 없습니다.");
        }

        Map<String, Object> firstFeature = features.get(0);
        Map<String, Object> propertiesMap = (Map<String, Object>) firstFeature.get("properties");
        if (propertiesMap == null) {
            throw new IllegalStateException("TMAP API 응답에 properties가 없습니다.");
        }

        Object totalTime = propertiesMap.get("totalTime");
        if (totalTime == null) {
            throw new IllegalStateException("TMAP API 응답에 totalTime이 없습니다.");
        }

        return ((Number) totalTime).intValue();
    }

    private int convertTravelTimeMinutes(int totalTimeSeconds, TravelMode travelMode) {
        int walkMinutes = (int) Math.max(1, Math.ceil(totalTimeSeconds / 60.0));

        return switch (travelMode) {
            case WALK -> walkMinutes;
            case BICYCLE -> Math.max(1, (int) Math.ceil(walkMinutes / 3.0));
        };
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
