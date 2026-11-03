package io.github.dongyuns.jubjub.domain.customer.ordertracking.dto;

import java.time.LocalDateTime;

public record OrderDepartureRecommendationResponse(
        Long orderId,
        LocalDateTime estimatedPickupTime,
        int walkingMinutes,
        int minutesUntilDeparture,
        LocalDateTime recommendedDepartureAt,
        LocalDateTime expectedArrivalAt,
        boolean leaveNow
) {
}
