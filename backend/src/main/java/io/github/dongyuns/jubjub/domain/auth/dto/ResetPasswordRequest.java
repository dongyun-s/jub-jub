package io.github.dongyuns.jubjub.domain.auth.dto;

public record ResetPasswordRequest(
        String email,
        Long logId,         // 인증번호 확인 시 받았던 그 로그 ID
        String newPassword  // 새롭게 설정할 비밀번호
) {}