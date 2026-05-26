package io.github.dongyuns.jubjub.domain.user.controller;

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

    @Operation(summary = "회원 탈퇴", description = "로그인 상태에서 현재 비밀번호를 다시 입력받아 계정을 영구 삭제합니다.")
    @DeleteMapping("/me")
    public ApiResponse<Void> withdraw(
            Authentication authentication, // JWT 토큰에서 로그인한 유저 이메일을 쏙 뽑아옵니다.
            @RequestParam String password) { // 검증용 비밀번호 수신

        String email = authentication.getName();
        userService.withdraw(email, password);
        return ApiResponse.success(null);
    }
}