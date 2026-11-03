package io.github.dongyuns.jubjub.domain.customer.auth.dto;

public record FindIdRequest(
        String name,
        String phone
) {}