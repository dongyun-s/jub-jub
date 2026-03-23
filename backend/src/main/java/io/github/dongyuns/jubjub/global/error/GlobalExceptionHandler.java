package io.github.dongyuns.jubjub.global.error;

import io.github.dongyuns.jubjub.global.common.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 모든 일반 Exception 처리
    @ExceptionHandler(Exception.class)
    public ApiResponse<?> handleException(Exception e) {
        // 🌟 콘솔(터미널)에 진짜 에러 원인을 빨간 글씨 표출
        e.printStackTrace();
        return ApiResponse.error("INTERNAL_SERVER_ERROR", e.getMessage());
    }

    // 커스텀 비즈니스 예외(예: 인증 실패 등)를 여기에 추가해 나갈 예정입니다.
}