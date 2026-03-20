package io.github.dongyuns.jubjub.domain.auth.controller;

import io.github.dongyuns.jubjub.domain.auth.dto.*;
import io.github.dongyuns.jubjub.domain.auth.entity.VerificationLog;
import io.github.dongyuns.jubjub.domain.auth.service.AuthService;
import io.github.dongyuns.jubjub.global.common.ApiResponse;
import io.github.dongyuns.jubjub.domain.user.dto.ProfileResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import io.github.dongyuns.jubjub.domain.auth.dto.ResetPasswordRequest;

@Tag(name = "Auth", description = "인증 관련 API")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "인증번호 발송", description = "이메일 또는 SMS로 6자리 인증번호를 발송하고 로그 ID를 반환합니다.")
    @PostMapping("/verify/send")
    public ApiResponse<VerificationSendResponse> sendVerificationCode(@RequestBody VerificationRequest request) {
        VerificationLog log = authService.sendVerificationCode(request.type(), request.target());
        return ApiResponse.success(new VerificationSendResponse(log.getId(), log.getExpiresAt()));
    }

    /**
     * 🌟 통합된 인증번호 확인 API
     * 중복되었던 메서드를 하나로 합쳤습니다.
     * 클라이언트는 JSON 바디에 logId와 code를 실어 보냅니다.
     */
    @Operation(summary = "인증번호 확인", description = "유저가 입력한 6자리 번호를 검증합니다.")
    @PostMapping("/verify/confirm")
    public ApiResponse<VerificationConfirmResponse> confirmVerificationCode(@RequestBody VerificationConfirmRequest request) {
        boolean isVerified = authService.confirmVerificationCode(request.logId(), request.code());
        return ApiResponse.success(new VerificationConfirmResponse(isVerified));
    }

    @Operation(summary = "회원가입", description = "인증 완료 후 새로운 회원 계정과 프로필을 등록합니다.")
    @PostMapping("/signup")
    public ApiResponse<String> signup(@RequestBody SignupRequest request) {
        authService.signup(request);
        return ApiResponse.success("회원가입이 완료되었습니다.");
    }

    @Operation(summary = "로그인", description = "이메일과 비밀번호로 로그인하고 JWT 토큰을 발급받습니다.")
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ApiResponse.success(response);
    }

    @Operation(summary = "내 프로필 조회", description = "JWT 토큰을 이용해 본인의 프로필 정보를 조회합니다.")
    @GetMapping("/me")
    public ApiResponse<ProfileResponse> getMyProfile(Authentication authentication) {
        String email = authentication.getName();
        ProfileResponse response = authService.getMyProfile(email);
        return ApiResponse.success(response);
    }

    @Operation(summary = "토큰 재발급", description = "만료된 Access Token 대신 Refresh Token을 사용하여 새로운 토큰을 발급받습니다.")
    @PostMapping("/reissue")
    public ApiResponse<TokenResponse> reissue(@RequestBody TokenRefreshRequest request) {
        // 서비스의 재발급 로직 호출
        TokenResponse response = authService.reissue(request.refreshToken());
        return ApiResponse.success(response);
    }

    @Operation(summary = "아이디(이메일) 찾기", description = "이름과 휴대폰 번호로 가입된 이메일을 찾습니다.")
    @PostMapping("/find-id")
    public ApiResponse<String> findId(@RequestBody FindIdRequest request) {
        String maskedEmail = authService.findId(request);
        return ApiResponse.success(maskedEmail);
    }

    @Operation(summary = "비밀번호 재설정", description = "이메일 인증을 마친 후 새로운 비밀번호로 변경합니다.")
    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.success(null);
    }

    @Operation(summary = "비밀번호 찾기 (인증번호 발송)", description = "가입된 이메일로 비밀번호 재설정을 위한 인증번호를 보냅니다.")
    @PostMapping("/find-password/send")
    public ApiResponse<Long> findPasswordSend(@RequestParam String email) {
        VerificationLog log = authService.sendResetPasswordCode(email);
        return ApiResponse.success(log.getId()); // 이후 reset-password에서 쓸 logId 반환
    }

    @Operation(summary = "비밀번호 변경 (로그인 상태)", description = "기존 비밀번호를 확인한 후 새로운 비밀번호로 변경합니다.")
    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(
            Authentication authentication, // 🌟 토큰에서 사용자 이메일을 가져옵니다.
            @RequestBody ChangePasswordRequest request) {

        String email = authentication.getName();
        authService.changePassword(email, request);
        return ApiResponse.success(null);
    }
}