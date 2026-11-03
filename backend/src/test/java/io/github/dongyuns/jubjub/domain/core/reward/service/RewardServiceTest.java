package io.github.dongyuns.jubjub.domain.core.reward.service;

import io.github.dongyuns.jubjub.domain.core.account.entity.Account;
import io.github.dongyuns.jubjub.domain.core.coupon.repository.CouponPolicyRepository;
import io.github.dongyuns.jubjub.domain.core.coupon.repository.MemberCouponRepository;
import io.github.dongyuns.jubjub.domain.core.coupon.service.CouponIssueService;
import io.github.dongyuns.jubjub.domain.core.member.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.core.member.repository.MemberProfileRepository;
import io.github.dongyuns.jubjub.domain.core.reward.entity.RewardHistory;
import io.github.dongyuns.jubjub.domain.core.reward.enums.RewardSource;
import io.github.dongyuns.jubjub.domain.core.reward.repository.RewardHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RewardServiceTest {

    @Mock private MemberProfileRepository memberProfileRepository;
    @Mock private RewardHistoryRepository rewardHistoryRepository;
    @Mock private MemberCouponRepository memberCouponRepository;
    @Mock private CouponPolicyRepository couponPolicyRepository;
    @Mock private CouponIssueService couponIssueService;

    private RewardService rewardService;

    @BeforeEach
    void setUp() {
        rewardService = new RewardService(memberProfileRepository, rewardHistoryRepository,
                memberCouponRepository, couponPolicyRepository, couponIssueService);
    }

    @Test
    void pickupUpdatesCountAndHistoryWithoutIssuingCoupons() {
        MemberProfile profile = profile();

        RewardService.PickupRewardResult result = rewardService.givePickupReward(profile, 100, 1200, 25L);

        assertThat(profile.getOrderCount()).isEqualTo(1);
        assertThat(profile.getTotalWalkingDistance()).isEqualTo(1200);
        assertThat(result.tierUpgraded()).isFalse();
        ArgumentCaptor<RewardHistory> history = ArgumentCaptor.forClass(RewardHistory.class);
        verify(rewardHistoryRepository).save(history.capture());
        assertThat(history.getValue().getRewardSource()).isEqualTo(RewardSource.EARN_PICKUP);
        assertThat(history.getValue().getReferenceId()).isEqualTo(25L);
        verify(couponIssueService, never()).issueCoupon(org.mockito.ArgumentMatchers.anyLong(),
                org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyInt());
    }

    @Test
    void duplicatePickupDoesNotIncrementCount() {
        MemberProfile profile = profile();
        when(rewardHistoryRepository.existsByRewardSourceAndReferenceId(RewardSource.EARN_PICKUP, 25L))
                .thenReturn(true);

        assertThatThrownBy(() -> rewardService.givePickupReward(profile, 100, 1200, 25L))
                .hasMessageContaining("이미 적립된 픽업 주문");
        assertThat(profile.getOrderCount()).isZero();
        verify(rewardHistoryRepository, never()).save(org.mockito.ArgumentMatchers.any(RewardHistory.class));
    }

    @Test
    void fifthPickupReportsTierUpgradeWithoutIssuingCouponInTransaction() {
        MemberProfile profile = profile();
        for (int i = 0; i < 4; i++) {
            profile.addReward(0, true);
        }

        RewardService.PickupRewardResult result = rewardService.givePickupReward(profile, 100, 0, 25L);

        assertThat(profile.getOrderCount()).isEqualTo(5);
        assertThat(result.tierUpgraded()).isTrue();
        verify(couponIssueService, never()).issueCoupon(org.mockito.ArgumentMatchers.anyLong(),
                org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyInt());
    }

    private MemberProfile profile() {
        return MemberProfile.builder()
                .account(Account.builder().email("user@example.com").password("password").build())
                .name("테스트")
                .phone("01012345678")
                .build();
    }
}
