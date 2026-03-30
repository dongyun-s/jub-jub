package io.github.dongyuns.jubjub.service.route;

import io.github.dongyuns.jubjub.dto.TravelMode;

public interface RouteTimeProvider {

    RouteTimeResult getRouteTime(
            double startLat,
            double startLng,
            double endLat,
            double endLng,
            TravelMode travelMode
    );
}