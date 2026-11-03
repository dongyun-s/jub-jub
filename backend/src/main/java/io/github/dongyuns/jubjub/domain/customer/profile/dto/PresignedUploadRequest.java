package io.github.dongyuns.jubjub.domain.customer.profile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record PresignedUploadRequest(
        @NotNull UploadType uploadType,
        @NotBlank String originalFileName,
        @NotBlank String contentType,
        @NotNull @Positive Long fileSize
) {
}
