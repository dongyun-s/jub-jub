package io.github.dongyuns.jubjub.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RouteOptimizeResponse {

    private Long storeId;
    private String storeName;
    private TravelMode travelMode;

    private double distanceKm;
    private int travelTimeMinutes;
    private int foodPrepTimeMinutes;

    private boolean leaveNow;
    private int recommendedDepartureDelayMinutes;
    private LocalDateTime recommendedDepartureTime;
    private LocalDateTime expectedArrivalTime;

    private String message;
}