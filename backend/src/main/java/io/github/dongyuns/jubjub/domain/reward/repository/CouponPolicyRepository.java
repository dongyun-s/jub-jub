package io.github.dongyuns.jubjub.domain.reward.repository;

import io.github.dongyuns.jubjub.domain.reward.entity.CouponPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CouponPolicyRepository extends JpaRepository<CouponPolicy, Long> {
    // 발급 조건(예: ATTENDANCE)과 할인 금액(예: 1000)으로 정책을 찾습니다.
    Optional<CouponPolicy> findByConditionTypeAndDiscountAmount(String conditionType, Integer discountAmount);
}