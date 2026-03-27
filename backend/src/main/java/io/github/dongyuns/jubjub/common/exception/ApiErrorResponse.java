package io.github.dongyuns.jubjub.common.exception;

import java.time.LocalDateTime;

public record ApiErrorResponse(
        String code,
        String message,
        LocalDateTime timestamp
) {
    public static ApiErrorResponse of(String code, String message) {
        // 에러 응답 시각을 함께 내려 프론트/로그 대조가 쉽도록 한다.
        return new ApiErrorResponse(code, message, LocalDateTime.now());
    }
}
