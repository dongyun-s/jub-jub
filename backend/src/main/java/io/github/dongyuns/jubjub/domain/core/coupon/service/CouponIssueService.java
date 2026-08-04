package io.github.dongyuns.jubjub.domain.core.coupon.service;

import io.github.dongyuns.jubjub.domain.core.coupon.entity.CouponPolicy;
import io.github.dongyuns.jubjub.domain.core.coupon.entity.MemberCoupon;
import io.github.dongyuns.jubjub.domain.core.notification.service.CouponNotificationService;
import io.github.dongyuns.jubjub.domain.core.coupon.repository.CouponPolicyRepository;
import io.github.dongyuns.jubjub.domain.core.coupon.repository.MemberCouponRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class CouponIssueService {

    private final CouponPolicyRepository couponPolicyRepository;
    private final MemberCouponRepository memberCouponRepository;
    private final CouponNotificationService couponNotificationService;

    /**
     * 기본 쿠폰 발급 로직 (용기 지참, 거리 보상 등에서 호출)
     */
    @Transactional
    public void issueCoupon(Long memberProfileId, String conditionType, Integer amount) {
        // 1. DB에서 조건에 맞는 쿠폰 정책(템플릿)을 찾습니다.
        CouponPolicy policy = couponPolicyRepository.findByConditionTypeAndDiscountAmount(conditionType, amount)
                .orElseThrow(() -> new IllegalArgumentException("조건에 맞는 쿠폰 정책이 존재하지 않습니다: " + conditionType));

        // 2. 정책에 설정된 유효기간(validDays)을 기반으로 만료 일시를 계산합니다. (예: 30일 뒤)
        LocalDateTime expiredAt = LocalDateTime.now().plusDays(policy.getValidDays());

        // 3. 유저에게 실제 쿠폰을 발급(저장)합니다.
        MemberCoupon memberCoupon = MemberCoupon.builder()
                .memberProfileId(memberProfileId)
                .couponPolicyId(policy.getId())
                .expiredAt(expiredAt)
                .build();

        MemberCoupon savedMemberCoupon = memberCouponRepository.save(memberCoupon);
        couponNotificationService.createIssuedNotification(savedMemberCoupon, policy);
        log.info("✅ 쿠폰 발급 완료: 유저 ID = {}, 쿠폰명 = {}", memberProfileId, policy.getName());
    }

    /**
     * 7일 연속 출석 랜덤박스 오픈 및 결과 반환 로직
     */
    @Transactional
    public String openAttendanceRandomBox(Long memberProfileId) {
        // 1. 보안과 무작위성이 뛰어난 SecureRandom 객체 생성
        SecureRandom secureRandom = new SecureRandom();
        double random = secureRandom.nextDouble() * 100; // 0.0 ~ 99.99...

        // 2. 확률 구간에 따른 쿠폰 발급 및 프론트엔드 연출용 결과 반환
        if (random < 5.0) {
            // 0.0 ~ 4.99 (5% 확률)
            issueCoupon(memberProfileId, "ATTENDANCE", 1000);
            log.info("🎉 [랜덤박스 당첨] 5% 대박! 1000원 할인쿠폰 발급 완료 (User ID: {})", memberProfileId);
            return "WIN_1000";

        } else if (random < 50.0) {
            // 5.0 ~ 49.99 (45% 확률)
            issueCoupon(memberProfileId, "ATTENDANCE", 100);
            log.info("🎉 [랜덤박스 당첨] 45% 당첨! 100원 할인쿠폰 발급 완료 (User ID: {})", memberProfileId);
            return "WIN_100";

        } else {
            // 50.0 ~ 99.99 (50% 확률)
            log.info("💀 [랜덤박스 결과] 50% 꽝입니다. 아쉽지만 다음 기회를 노려보세요! (User ID: {})", memberProfileId);
            return "LOSE";
        }
    }
}
