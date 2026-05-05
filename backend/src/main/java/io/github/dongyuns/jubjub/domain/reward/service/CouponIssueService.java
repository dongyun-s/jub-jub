package io.github.dongyuns.jubjub.domain.reward.service;

import io.github.dongyuns.jubjub.domain.reward.entity.CouponPolicy;
import io.github.dongyuns.jubjub.domain.reward.entity.MemberCoupon;
import io.github.dongyuns.jubjub.domain.reward.repository.CouponPolicyRepository;
import io.github.dongyuns.jubjub.domain.reward.repository.MemberCouponRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class CouponIssueService {

    private final CouponPolicyRepository couponPolicyRepository;
    private final MemberCouponRepository memberCouponRepository;

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

        memberCouponRepository.save(memberCoupon);
        log.info("쿠폰 발급 완료: 유저 ID = {}, 쿠폰명 = {}", memberProfileId, policy.getName());
    }

    @Transactional
    public void issueAttendanceRandomBox(Long memberProfileId) {
        double random = Math.random() * 100; // 0.0 ~ 99.99.. 생성

        if (random < 5.0) { // 상위 5% 확률 (0.0 ~ 4.99)
            issueCoupon(memberProfileId, "ATTENDANCE", 1000);
            log.info("🎉 5% 확률 당첨! 1000원 쿠폰 발급");
        } else if (random < 50.0) { // 45% 확률 (5.0 ~ 49.99)
            issueCoupon(memberProfileId, "ATTENDANCE", 100);
            log.info("🎉 45% 확률 당첨! 100원 쿠폰 발급");
        } else {
            // 나머지 50%는 꽝
            log.info("💣 아쉽게도 꽝입니다.");
        }
    }
}