package io.github.dongyuns.jubjub.domain.owner.store.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record UpdateStoreCookingTimeRequest(
        @NotNull(message = "조리 시간은 필수입니다.")
        @Positive(message = "조리 시간은 1분 이상이어야 합니다.")
        Integer cookingTimeMinutes
) {}
