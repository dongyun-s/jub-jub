package io.github.dongyuns.jubjub.domain.storesort.service;

import org.springframework.stereotype.Component;

@Component
public class StoreDistanceCalculator {

    private static final double EARTH_RADIUS_METERS = 6_371_000d;

    public double calculateMeters(double sourceLatitude, double sourceLongitude, double targetLatitude, double targetLongitude) {
        double lat1 = Math.toRadians(sourceLatitude);
        double lon1 = Math.toRadians(sourceLongitude);
        double lat2 = Math.toRadians(targetLatitude);
        double lon2 = Math.toRadians(targetLongitude);

        double deltaLat = lat2 - lat1;
        double deltaLon = lon2 - lon1;

        double a = Math.pow(Math.sin(deltaLat / 2), 2)
                + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(deltaLon / 2), 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_METERS * c;
    }
}
