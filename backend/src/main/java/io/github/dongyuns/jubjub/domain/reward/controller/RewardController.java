package io.github.dongyuns.jubjub.domain.reward.controller;

import io.github.dongyuns.jubjub.domain.reward.dto.RewardProfileResponse;
import io.github.dongyuns.jubjub.domain.reward.service.RewardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 🌟 컨트롤러 그룹 이름을 예쁘게 바꿔줍니다.
@Tag(name = "리워드 API", description = "사용자의 등급, 경험치, 쿠폰 등을 관리하는 API")
@RestController
@RequestMapping("/api/v1/rewards")
@RequiredArgsConstructor
public class RewardController {

    private final RewardService rewardService;

    // 🌟 API의 이름(summary)과 상세 설명(description)을 달아줍니다.
    @Operation(summary = "내 리워드 정보 조회", description = "현재 로그인한 사용자의 마이페이지용 리워드 정보(등급, 누적 횟수, 경험치 등)를 조회합니다.")
    @GetMapping("/me")
    public ResponseEntity<RewardProfileResponse> getMyRewardProfile(Authentication authentication) {
        String accountEmail = authentication.getName();

        RewardProfileResponse response = rewardService.getMyRewardProfile(accountEmail);
        return ResponseEntity.ok(response);
    }
}