package io.github.dongyuns.jubjub.domain.shared.external.tmap;

import io.github.dongyuns.jubjub.domain.customer.route.dto.TravelMode;

public interface RouteTimeProvider {

    RouteTimeResult getRouteTime(
            double startLat,
            double startLng,
            double endLat,
            double endLng,
            TravelMode travelMode
    );
}
