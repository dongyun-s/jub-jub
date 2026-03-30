package io.github.dongyuns.jubjub.service.route;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RouteTimeResult {
    private double distanceKm;
    private int travelTimeMinutes;
}