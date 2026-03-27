package io.github.dongyuns.jubjub.common.exception;

import org.springframework.http.HttpStatus;

public class BusinessException extends RuntimeException {

    // 서비스 로직에서 예상 가능한 예외는 코드와 HTTP 상태를 같이 들고 다닌다.
    private final String code;
    private final HttpStatus status;

    public BusinessException(String code, String message, HttpStatus status) {
        super(message);
        this.code = code;
        this.status = status;
    }

    public String getCode() {
        return code;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
