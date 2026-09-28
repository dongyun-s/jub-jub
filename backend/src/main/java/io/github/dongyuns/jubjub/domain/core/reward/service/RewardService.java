package io.github.dongyuns.jubjub.domain.core.reward.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.customer.coupon.dto.MemberCouponResponse;
import io.github.dongyuns.jubjub.domain.customer.reward.dto.RewardProfileResponse;
import io.github.dongyuns.jubjub.domain.core.coupon.entity.CouponPolicy;
import io.github.dongyuns.jubjub.domain.core.coupon.entity.MemberCoupon;
import io.github.dongyuns.jubjub.domain.core.coupon.service.CouponIssueService;
import io.github.dongyuns.jubjub.domain.core.reward.entity.RewardHistory;
import io.github.dongyuns.jubjub.domain.core.reward.enums.RewardSource;
import io.github.dongyuns.jubjub.domain.core.reward.enums.RewardTier; // 티어 비교를 위한 임포트
import io.github.dongyuns.jubjub.domain.core.reward.enums.RewardType; // 기존 로직 존중
import io.github.dongyuns.jubjub.domain.core.coupon.repository.CouponPolicyRepository;
import io.github.dongyuns.jubjub.domain.core.coupon.repository.MemberCouponRepository;
import io.github.dongyuns.jubjub.domain.core.reward.repository.RewardHistoryRepository;
import io.github.dongyuns.jubjub.domain.core.member.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.core.member.repository.MemberProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; // 승급 축하 로그를 찍기 위함
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RewardService {

    private final MemberProfileRepository memberProfileRepository;
    private final RewardHistoryRepository rewardHistoryRepository;
    private final MemberCouponRepository memberCouponRepository;
    private final CouponPolicyRepository couponPolicyRepository;
    private final CouponIssueService couponIssueService;

    // ==========================================
    // 1. [조회]
    // ==========================================
    @Transactional(readOnly = true)
    public RewardProfileResponse getMyRewardProfile(String accountEmail) {
        MemberProfile profile = memberProfileRepository.findByAccountEmail(accountEmail)
                .orElseThrow(() -> new BusinessException("MEMBER_NOT_FOUND", "회원 정보를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        return RewardProfileResponse.from(profile);
    }

    // ==========================================
    // 2. [범용 적립] 모든 보상(픽업, 출석 등)을 처리하는 핵심 로직
    // ==========================================
    @Transactional
    public void earnReward(MemberProfile profile, RewardSource source, int xp, int distance, Long referenceId) {
        PickupRewardResult result = recordReward(profile, source, xp, distance, referenceId);
        if (result.tierUpgraded()) {
            // DB 쿠폰 정책에 condition_type="TIER_UPGRADE", amount=1000 을 넣어두셔야 합니다!
            couponIssueService.issueCoupon(profile.getId(), "TIER_UPGRADE", 1000);
            log.info("회원 {} 승급 쿠폰 발급 완료", profile.getId());
        }
        if (result.distanceCouponCount() > 0) {
            for (int i = 0; i < result.distanceCouponCount(); i++) {
                // DB의 condition_type="DISTANCE", amount=1000 인 정책을 찾아 발급합니다.
                couponIssueService.issueCoupon(profile.getId(), "DISTANCE", 1000);
            }
        }
    }

    // ==========================================
    // 3. [픽업 전용 적립]
    // ==========================================
    @Transactional
    public PickupRewardResult givePickupReward(MemberProfile profile, int xp, int distance, Long orderId) {
        if (rewardHistoryRepository.existsByRewardSourceAndReferenceId(RewardSource.EARN_PICKUP, orderId)) {
            throw new BusinessException("PICKUP_REWARD_ALREADY_GRANTED", "이미 적립된 픽업 주문입니다.", HttpStatus.CONFLICT);
        }
        return recordReward(profile, RewardSource.EARN_PICKUP, xp, distance, orderId);
    }

    private PickupRewardResult recordReward(MemberProfile profile, RewardSource source, int xp, int distance, Long referenceId) {
        RewardTier previousTier = profile.getTier();
        int distanceCouponCount = profile.addReward(distance, source == RewardSource.EARN_PICKUP);
        rewardHistoryRepository.save(RewardHistory.builder()
                .memberProfile(profile)
                .rewardType(RewardType.EARNED)
                .rewardSource(source)
                .earnedXp(xp)
                .earnedDistance(distance)
                .referenceId(referenceId)
                .build());
        return new PickupRewardResult(profile.getId(), previousTier.ordinal() < profile.getTier().ordinal(), distanceCouponCount);
    }

    public record PickupRewardResult(Long memberProfileId, boolean tierUpgraded, int distanceCouponCount) {
    }

    // ==========================================
    // 4. [쿠폰 조회] 프론트엔드 화면 표시용
    // ==========================================
    @Transactional(readOnly = true)
    public List<MemberCouponResponse> getMyAvailableCoupons(Long memberProfileId) {
        List<MemberCoupon> myCoupons = memberCouponRepository.findAllByMemberProfileIdAndIsUsedFalse(memberProfileId);

        return myCoupons.stream().map(coupon -> {
            CouponPolicy policy = couponPolicyRepository.findById(coupon.getCouponPolicyId())
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 쿠폰 정책입니다."));

            return MemberCouponResponse.builder()
                    .memberCouponId(coupon.getId())
                    .name(policy.getName())
                    .discountAmount(policy.getDiscountAmount())
                    .minOrderAmount(policy.getMinOrderAmount())
                    .expiredAt(coupon.getExpiredAt().toLocalDate())
                    .build();
        }).toList();
    }
}
