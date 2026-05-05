package io.github.dongyuns.jubjub.domain.media.dto;

import jakarta.validation.constraints.NotBlank;

public record ProfileImageUpsertRequest(
        @NotBlank String imagePath
) {
}
