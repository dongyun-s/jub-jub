package io.github.dongyuns.jubjub.domain.customer.profile.dto;

public record ProfileUpdateRequest(
        String nickname,
        String phone
) {}