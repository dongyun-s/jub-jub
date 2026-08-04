package io.github.dongyuns.jubjub.domain.owner.auth.controller;

import io.github.dongyuns.jubjub.common.response.ApiResponse;
import io.github.dongyuns.jubjub.domain.owner.auth.dto.OwnerRegisterRequest;
import io.github.dongyuns.jubjub.domain.owner.auth.dto.OwnerSignupRequest;
import io.github.dongyuns.jubjub.domain.owner.auth.service.OwnerAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/owner/auth")
@RequiredArgsConstructor
public class OwnerAuthController {

    private final OwnerAuthService ownerAuthService;

    @GetMapping("/test")
    public ApiResponse<String> test() {
        return ApiResponse.success("Owner API Test");
    }

    /**
     * 사장님 회원가입
     * 1. 신규 이메일: 이메일 인증 완료 후 회원가입 (logId 필수)
     *    - 인증 플로우: POST /api/v1/auth/verify/send → POST /api/v1/auth/verify/confirm → POST /api/v1/owner/auth/signup
     * 2. 기존 이메일(USER): 인증 없이 USER → OWNER 전환 (logId 불필요)
     */
    @PostMapping("/signup")
    public ApiResponse<String> signup(
            @RequestBody OwnerSignupRequest request
    ) {

        ownerAuthService.signup(request);

        return ApiResponse.success("사장님 회원가입이 완료되었습니다.");
    }

    /**
     * 기존 USER → OWNER 전환
     * (로그인 상태)
     */
    @PostMapping("/register")
    public ApiResponse<String> register(
            Authentication authentication,
            @RequestBody OwnerRegisterRequest request
    ) {

        ownerAuthService.register(
                authentication.getName(),
                request
        );

        return ApiResponse.success("사장님 등록이 완료되었습니다.");
    }

}