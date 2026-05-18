package io.github.dongyuns.jubjub.payment.dto;

import jakarta.validation.constraints.NotNull;

public record CompletePickupRequest(
        @NotNull Double userLatitude,
        @NotNull Double userLongitude
) {
}
