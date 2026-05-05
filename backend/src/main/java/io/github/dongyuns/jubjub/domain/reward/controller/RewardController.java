package io.github.dongyuns.jubjub.domain.reward.controller;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.reward.dto.RewardProfileResponse;
import io.github.dongyuns.jubjub.domain.reward.service.AttendanceService;
import io.github.dongyuns.jubjub.domain.reward.service.RewardService;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.user.repository.MemberProfileRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "리워드 API", description = "사용자의 등급, 경험치, 출석체크 등을 관리하는 API")
@RestController
@RequestMapping("/api/v1/rewards")
@RequiredArgsConstructor
public class RewardController {

    private final RewardService rewardService;
    // 🌟 출석체크 기능과 프로필 조회를 위해 주입
    private final AttendanceService attendanceService;
    private final MemberProfileRepository memberProfileRepository;

    // ==========================================
    // 1. 내 리워드 정보 조회
    // ==========================================
    @Operation(summary = "내 리워드 정보 조회", description = "현재 로그인한 사용자의 마이페이지용 리워드 정보(등급, 누적 횟수, 경험치 등)를 조회합니다.")
    @GetMapping("/me")
    public ResponseEntity<RewardProfileResponse> getMyRewardProfile(Authentication authentication) {
        String accountEmail = authentication.getName();

        RewardProfileResponse response = rewardService.getMyRewardProfile(accountEmail);
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // 2. 출석체크 기능
    // ==========================================
    @Operation(summary = "출석체크 진행", description = "하루에 한 번 출석체크를 진행하고 경험치 보상을 획득합니다.")
    @PostMapping("/attendance")
    public ResponseEntity<String> checkIn(Authentication authentication) {
        String accountEmail = authentication.getName();

        // 1. 이메일로 현재 로그인한 회원의 프로필을 조회합니다.
        MemberProfile profile = memberProfileRepository.findByAccountEmail(accountEmail)
                .orElseThrow(() -> new BusinessException("MEMBER_NOT_FOUND", "회원 정보를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        // 2. 출석체크 비즈니스 로직을 실행합니다. (보상 지급까지 완벽하게 처리됨)
        attendanceService.checkIn(profile);

        // 3. 성공 메시지를 반환합니다.
        return ResponseEntity.ok("출석체크가 완료되었습니다. 보상이 지급되었습니다!");
    }
}