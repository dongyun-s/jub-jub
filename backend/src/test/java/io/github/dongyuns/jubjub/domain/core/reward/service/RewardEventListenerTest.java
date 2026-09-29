package io.github.dongyuns.jubjub.domain.core.reward.service;

import io.github.dongyuns.jubjub.domain.core.coupon.service.CouponIssueService;
import io.github.dongyuns.jubjub.domain.core.reward.event.PickupCompletedEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class RewardEventListenerTest {

    @Mock private CouponIssueService couponIssueService;

    @Test
    void couponFailureDoesNotSkipRemainingCoupons() {
        RewardEventListener listener = new RewardEventListener(couponIssueService);
        doThrow(new IllegalStateException("policy missing"))
                .when(couponIssueService).issueCoupon(7L, "TIER_UPGRADE", 1000);

        listener.handlePickupCompleted(new PickupCompletedEvent(7L, 25L, true, 1, true));

        verify(couponIssueService).issueCoupon(7L, "DISTANCE", 1000);
        verify(couponIssueService).issueCoupon(7L, "ECO", 200);
    }
}
