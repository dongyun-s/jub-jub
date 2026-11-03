package io.github.dongyuns.jubjub.domain.customer.profile.dto;

public record ProfileResponse(
        String email,
        String name,
        String phone,
        String nickname,
        String profileImagePath
) {}
