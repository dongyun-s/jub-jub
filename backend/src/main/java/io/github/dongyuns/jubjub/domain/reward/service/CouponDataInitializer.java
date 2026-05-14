package io.github.dongyuns.jubjub.domain.reward.service;

import io.github.dongyuns.jubjub.domain.reward.entity.CouponPolicy;
import io.github.dongyuns.jubjub.domain.reward.repository.CouponPolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CouponDataInitializer implements CommandLineRunner {

    private final CouponPolicyRepository couponPolicyRepository;

    @Override
    public void run(String... args) {
        // 1. 다회용기 지참 정책 (ECO / 200원 / 30일)
        savePolicyIfAbsent("다회용기 지참 감사 쿠폰", "ECO", 200, 30);

        // 2. 거리 보상 정책 (DISTANCE / 1000원 / 30일)
        savePolicyIfAbsent("5km 달성 기념 거리 보상 쿠폰", "DISTANCE", 1000, 30);

        // 3. 출석 랜덤박스 - 일반 당첨 (ATTENDANCE / 100원 / 30일)
        savePolicyIfAbsent("출석체크 일반 당첨 쿠폰", "ATTENDANCE", 100, 30);

        // 4. 출석 랜덤박스 - 잭팟 (ATTENDANCE / 1000원 / 30일)
        savePolicyIfAbsent("출석체크 잭팟 당첨 쿠폰", "ATTENDANCE", 1000, 30);

        // 5. 이벤트 쿠폰 (EVENT / 1000원, 3000원, 5000원 / 30일)
        savePolicyIfAbsent("이벤트 쿠폰 1000원", "EVENT", 1000, 30);
        savePolicyIfAbsent("이벤트 쿠폰 3000원", "EVENT", 3000, 30);
        savePolicyIfAbsent("이벤트 쿠폰 5000원", "EVENT", 5000, 30);
    }

    private void savePolicyIfAbsent(String name, String type, Integer amount, Integer days) {
        if (couponPolicyRepository.findByConditionTypeAndDiscountAmount(type, amount).isEmpty()) {
            couponPolicyRepository.save(CouponPolicy.builder()
                    .name(name)
                    .conditionType(type)
                    .discountAmount(amount)
                    .validDays(days)
                    .build());
        }
    }
}
