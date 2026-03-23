package io.github.dongyuns.jubjub.domain.user.dto;

public record ProfileResponse(
        String email,
        String name,
        String phone,
        String nickname
) {}