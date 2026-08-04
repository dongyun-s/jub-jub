package io.github.dongyuns.jubjub.common.response;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private T data;
    private ErrorResponse error;

    // 성공 응답용 생성자
    private ApiResponse(boolean success, T data) {
        this.success = success;
        this.data = data;
        this.error = null;
    }

    // 에러 응답용 생성자
    private ApiResponse(boolean success, String code, String message) {
        this.success = success;
        this.data = null;
        this.error = new ErrorResponse(code, message);
    }

    // 성공 팩토리 메서드
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data);
    }

    // 에러 팩토리 메서드 (이게 추가되어야 GlobalExceptionHandler에서 쓸 수 있습니다!)
    public static ApiResponse<?> error(String code, String message) {
        return new ApiResponse<>(false, code, message);
    }

    @Getter
    @NoArgsConstructor
    public static class ErrorResponse {
        private String code;
        private String message;

        public ErrorResponse(String code, String message) {
            this.code = code;
            this.message = message;
        }
    }
}