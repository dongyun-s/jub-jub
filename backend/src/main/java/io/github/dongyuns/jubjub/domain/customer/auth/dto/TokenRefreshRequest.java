package io.github.dongyuns.jubjub.domain.customer.auth.dto;

public record TokenRefreshRequest(
        String refreshToken
) {}