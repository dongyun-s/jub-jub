package io.github.dongyuns.jubjub.domain.route.service;

import io.github.dongyuns.jubjub.domain.route.dto.TravelMode;

public interface RouteTimeProvider {

    RouteTimeResult getRouteTime(
            double startLat,
            double startLng,
            double endLat,
            double endLng,
            TravelMode travelMode
    );
}
