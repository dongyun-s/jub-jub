package io.github.dongyuns.jubjub.domain.user.controller;

import io.github.dongyuns.jubjub.domain.user.dto.ProfileUpdateRequest;
import io.github.dongyuns.jubjub.domain.user.service.UserService;
import io.github.dongyuns.jubjub.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "User", description = "회원 정보 관리 API")
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "내 프로필 수정", description = "닉네임과 전화번호를 안전하게 수정합니다.")
    @PutMapping("/me")
    public ApiResponse<Void> updateMyProfile(
            Authentication authentication,
            @RequestBody ProfileUpdateRequest request) {

        // JWT 토큰에서 이메일을 꺼내서 Service로 넘깁니다.
        String email = authentication.getName();
        userService.updateProfile(email, request);
        return ApiResponse.success(null);
    }

    @Operation(summary = "회원 탈퇴", description = "로그인 상태에서 현재 비밀번호를 다시 입력받아 계정을 탈퇴 처리(Soft Delete)합니다.")
    @DeleteMapping("/me")
    public ApiResponse<Void> withdraw(
            Authentication authentication, // JWT 토큰에서 로그인한 유저 이메일을 쏙 뽑아옵니다.
            @RequestParam String password) { // 검증용 비밀번호 수신

        String email = authentication.getName();
        userService.withdraw(email, password);
        return ApiResponse.success(null);
    }
}