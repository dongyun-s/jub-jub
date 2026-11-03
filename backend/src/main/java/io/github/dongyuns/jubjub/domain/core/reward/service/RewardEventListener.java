package io.github.dongyuns.jubjub.domain.core.reward.service;

import io.github.dongyuns.jubjub.domain.core.coupon.service.CouponIssueService;
import io.github.dongyuns.jubjub.domain.core.reward.event.PickupCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class RewardEventListener {

    private final CouponIssueService couponIssueService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handlePickupCompleted(PickupCompletedEvent event) {
        if (event.isTierUpgraded()) {
            issueCoupon(event, "TIER_UPGRADE", 1000);
        }
        for (int i = 0; i < event.getDistanceCouponCount(); i++) {
            issueCoupon(event, "DISTANCE", 1000);
        }
        if (event.isUseMultiUseContainer()) {
            issueCoupon(event, "ECO", 200);
        }
    }

    private void issueCoupon(PickupCompletedEvent event, String conditionType, int amount) {
        try {
            couponIssueService.issueCoupon(event.getMemberProfileId(), conditionType, amount);
        } catch (Exception e) {
            log.error("주문 {}의 {} 쿠폰 발급 실패 (회원 {})",
                    event.getOrderId(), conditionType, event.getMemberProfileId(), e);
        }
    }
}
