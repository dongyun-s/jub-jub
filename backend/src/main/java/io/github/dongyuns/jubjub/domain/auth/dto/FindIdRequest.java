package io.github.dongyuns.jubjub.domain.auth.dto;

public record FindIdRequest(
        String name,
        String phone
) {}