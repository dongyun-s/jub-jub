package io.github.dongyuns.jubjub.domain.route.service;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RouteTimeResult {
    private double distanceKm;
    private int travelTimeMinutes;
}
