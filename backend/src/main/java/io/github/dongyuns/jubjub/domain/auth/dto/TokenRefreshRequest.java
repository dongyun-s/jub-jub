package io.github.dongyuns.jubjub.domain.auth.dto;

public record TokenRefreshRequest(
        String refreshToken
) {}