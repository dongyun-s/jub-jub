package io.github.dongyuns.jubjub.domain.shared.external.tmap;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RouteTimeResult {
    private int distanceMeters;
    private double distanceKm;
    private int travelTimeMinutes;
}
