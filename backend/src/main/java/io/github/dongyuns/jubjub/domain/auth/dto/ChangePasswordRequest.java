package io.github.dongyuns.jubjub.domain.auth.dto;

public record ChangePasswordRequest(
        String currentPassword, // 기존 비번
        String newPassword      // 바꿀 비번
) {}
