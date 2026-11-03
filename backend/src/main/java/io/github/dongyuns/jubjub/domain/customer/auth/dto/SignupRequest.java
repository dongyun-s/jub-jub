package io.github.dongyuns.jubjub.domain.customer.auth.dto;

public record SignupRequest(
        String email,
        String password,
        String name,
        String phone,
        String nickname
) {}