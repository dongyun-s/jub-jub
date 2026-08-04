package io.github.dongyuns.jubjub.domain.customer.reward.controller;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.customer.reward.dto.AttendanceHistoryResponse;
import io.github.dongyuns.jubjub.domain.customer.coupon.dto.DiscountCalculateRequest;
import io.github.dongyuns.jubjub.domain.customer.coupon.dto.DiscountCalculateResponse;
import io.github.dongyuns.jubjub.domain.customer.coupon.dto.MemberCouponResponse;
import io.github.dongyuns.jubjub.domain.customer.reward.dto.RewardProfileResponse;
import io.github.dongyuns.jubjub.domain.core.reward.service.AttendanceService;
import io.github.dongyuns.jubjub.domain.core.coupon.service.CouponIssueService;
import io.github.dongyuns.jubjub.domain.core.coupon.service.DiscountCalculatorService;
import io.github.dongyuns.jubjub.domain.core.reward.service.RewardService;
import io.github.dongyuns.jubjub.domain.core.member.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.core.member.repository.MemberProfileRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Tag(name = "리워드 API", description = "사용자의 등급, 경험치, 출석체크 등을 관리하는 API")
@RestController
@RequestMapping("/api/v1/rewards")
@RequiredArgsConstructor
public class RewardController {

    private final RewardService rewardService;
    private final AttendanceService attendanceService;
    private final CouponIssueService couponIssueService;
    private final MemberProfileRepository memberProfileRepository;
    private final DiscountCalculatorService discountCalculatorService;

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
    @Operation(summary = "출석체크 진행", description = "하루에 한 번 출석체크를 진행하고, 일주일 연속 달성 시 랜덤박스 오픈 권한(isRandomBoxAvailable = true)을 반환합니다.")
    @PostMapping("/attendance")
    public ResponseEntity<Map<String, Object>> checkIn(Authentication authentication) {
        String accountEmail = authentication.getName();

        MemberProfile profile = memberProfileRepository.findByAccountEmail(accountEmail)
                .orElseThrow(() -> new BusinessException("MEMBER_NOT_FOUND", "회원 정보를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        // 7일 연속 개근을 충족했다면 true, 아니면 false 반환
        boolean isRandomBoxAvailable = attendanceService.checkIn(profile);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "출석체크가 완료되었습니다. 보상이 지급되었습니다!");
        response.put("isRandomBoxAvailable", isRandomBoxAvailable);

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // 2-1. 랜덤박스 오픈 API (무한 가챠 방어 적용 🛡️)
    // ==========================================
    @Operation(summary = "랜덤박스 오픈", description = "일주일 연속 출석을 달성한 유저가 상자를 열어 확률(꽝 50%, 100원 45%, 1000원 5%)에 따라 보상을 뽑습니다.")
    @PostMapping("/random-box")
    public ResponseEntity<Map<String, String>> openRandomBox(Authentication authentication) {
        String accountEmail = authentication.getName();

        MemberProfile profile = memberProfileRepository.findByAccountEmail(accountEmail)
                .orElseThrow(() -> new BusinessException("MEMBER_NOT_FOUND", "회원 정보를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        // 1. 철통 방어: 7일 연속이 맞는지 + 오늘 이미 깠는지 사전에 검증
        attendanceService.validateRandomBoxEligibility(profile);

        // 2. 가챠 돌리기 (결과 반환)
        String result = couponIssueService.openAttendanceRandomBox(profile.getId());

        // 3. 무한 가챠 방지: "이 유저 오늘 상자 깠음!" 상태 저장 (도장 쾅!)
        attendanceService.markRandomBoxAsOpened(profile);

        Map<String, String> response = new HashMap<>();
        response.put("result", result);

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // 3. 내 쿠폰함 목록 조회 API
    // ==========================================
    @Operation(summary = "내 쿠폰 목록 조회", description = "현재 사용 가능한(미사용) 쿠폰 목록을 조회합니다.")
    @GetMapping("/coupons")
    public ResponseEntity<List<MemberCouponResponse>> getMyCoupons(Authentication authentication) {
        String accountEmail = authentication.getName();

        MemberProfile profile = memberProfileRepository.findByAccountEmail(accountEmail)
                .orElseThrow(() -> new BusinessException("MEMBER_NOT_FOUND", "회원 정보를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        List<MemberCouponResponse> response = rewardService.getMyAvailableCoupons(profile.getId());
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // 4. 복합 할인 적용 금액 계산 API
    // ==========================================
    @Operation(summary = "할인 적용 금액 계산", description = "등급 할인 및 선택한 쿠폰들을 적용하여 최종 결제 금액을 계산합니다.")
    @PostMapping("/calculate")
    public ResponseEntity<DiscountCalculateResponse> calculateDiscount(
            Authentication authentication,
            @RequestBody DiscountCalculateRequest request) {

        String accountEmail = authentication.getName();

        DiscountCalculateResponse response = discountCalculatorService.calculateDiscount(accountEmail, request);
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // 5. 달력용 출석 내역 조회 API
    // ==========================================
    @Operation(summary = "월별 출석 달력 조회", description = "특정 연/월의 출석 날짜 목록을 반환합니다. (파라미터 생략 시 이번 달 기준)")
    @GetMapping("/attendance/history")
    public ResponseEntity<AttendanceHistoryResponse> getAttendanceHistory(
            Authentication authentication,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {

        String accountEmail = authentication.getName();

        LocalDate now = LocalDate.now();
        int targetYear = (year != null) ? year : now.getYear();
        int targetMonth = (month != null) ? month : now.getMonthValue();

        AttendanceHistoryResponse response = attendanceService.getMyAttendanceHistory(accountEmail, targetYear, targetMonth);
        return ResponseEntity.ok(response);
    }
}