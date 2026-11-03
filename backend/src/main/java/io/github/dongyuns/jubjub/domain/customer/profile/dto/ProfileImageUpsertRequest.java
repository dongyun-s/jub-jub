package io.github.dongyuns.jubjub.domain.customer.profile.dto;

import jakarta.validation.constraints.NotBlank;

public record ProfileImageUpsertRequest(
        @NotBlank String imagePath
) {
}
