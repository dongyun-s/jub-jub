package io.github.dongyuns.jubjub.domain.media.dto;

import java.time.Instant;

public record PresignedUploadResponse(
        String objectKey,
        String uploadUrl,
        String fileUrl,
        Instant expiresAt
) {
}
