package io.github.dongyuns.jubjub.domain.user.dto;

public record ProfileUpdateRequest(
        String nickname,
        String phone
) {}