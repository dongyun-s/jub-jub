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

        // 1) 보상 추가 전의 (과거) 티어를 기억해 둡니다.
        RewardTier previousTier = profile.getTier();

        // 2) 프로필 수치 업데이트 (픽업일 경우에만 횟수 증가 및 승급 심사)
        boolean isPickup = (source == RewardSource.EARN_PICKUP);
        int earnedDistanceCoupons = profile.addReward(distance, isPickup);

        // 3) 보상 추가 후의 (현재) 티어를 확인합니다.
        RewardTier currentTier = profile.getTier();

        // 4) 과거 티어보다 현재 티어가 더 높다면? (승급 성공!)
        if (previousTier.ordinal() < currentTier.ordinal()) {
            // DB 쿠폰 정책에 condition_type="TIER_UPGRADE", amount=1000 을 넣어두셔야 합니다!
            couponIssueService.issueCoupon(profile.getId(), "TIER_UPGRADE", 1000);
            log.info("🎉 [승급 축하] {} -> {} 승급! 1000원 쿠폰 발급 완료 (User ID: {})",
                    previousTier.name(), currentTier.name(), profile.getId());
        }

        // 5) 최신화된 RewardHistory 엔티티 구조에 맞춰 적립 내역 저장
        RewardHistory history = RewardHistory.builder()
                .memberProfile(profile)
                .rewardType(RewardType.EARNED) // 적립 고정
                .rewardSource(source)
                .earnedXp(xp)
                .earnedDistance(distance)
                .referenceId(referenceId)
                // description은 엔티티 내부에서 source.getDescription()으로 자동 처리됨
                .build();

        rewardHistoryRepository.save(history);

        // 6) 🎯 10km 돌파 횟수만큼 거리 보상(DISTANCE) 1000원 쿠폰 발급!
        if (earnedDistanceCoupons > 0) {
            for (int i = 0; i < earnedDistanceCoupons; i++) {
                // DB의 condition_type="DISTANCE", amount=1000 인 정책을 찾아 발급합니다.
                couponIssueService.issueCoupon(profile.getId(), "DISTANCE", 1000);
            }
        }
    }

    // ==========================================
    // 3. [픽업 전용 적립]
    // ==========================================
    @Transactional
    public void givePickupReward(String email, int xp, int distance, Long orderId) {
        MemberProfile profile = memberProfileRepository.findByAccountEmail(email)
                .orElseThrow(() -> new BusinessException("MEMBER_NOT_FOUND", "회원을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        earnReward(profile, RewardSource.EARN_PICKUP, xp, distance, orderId);
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
