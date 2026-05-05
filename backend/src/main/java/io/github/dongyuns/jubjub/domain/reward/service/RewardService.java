package io.github.dongyuns.jubjub.domain.reward.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.reward.dto.MemberCouponResponse;
import io.github.dongyuns.jubjub.domain.reward.dto.RewardProfileResponse;
import io.github.dongyuns.jubjub.domain.reward.entity.CouponPolicy;
import io.github.dongyuns.jubjub.domain.reward.entity.MemberCoupon;
import io.github.dongyuns.jubjub.domain.reward.entity.RewardHistory;
import io.github.dongyuns.jubjub.domain.reward.enums.RewardSource;
import io.github.dongyuns.jubjub.domain.reward.enums.RewardType; // 기존 로직 존중
import io.github.dongyuns.jubjub.domain.reward.repository.CouponPolicyRepository;
import io.github.dongyuns.jubjub.domain.reward.repository.MemberCouponRepository;
import io.github.dongyuns.jubjub.domain.reward.repository.RewardHistoryRepository;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.user.repository.MemberProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RewardService {

    private final MemberProfileRepository memberProfileRepository;
    private final RewardHistoryRepository rewardHistoryRepository;
    // 프론트엔드 쿠폰 조회를 위해 새로 추가된 레포지토리 의존성
    private final MemberCouponRepository memberCouponRepository;
    private final CouponPolicyRepository couponPolicyRepository;

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

        // 1) 프로필 수치 업데이트 (픽업일 경우에만 횟수 증가 및 승급 심사)
        boolean isPickup = (source == RewardSource.EARN_PICKUP);
        profile.addReward(xp, distance, isPickup);

        // 2) 최신화된 RewardHistory 엔티티 구조에 맞춰 적립 내역 저장
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
    }

    // ==========================================
    // 3. [픽업 전용 적립]
    // ==========================================
    @Transactional
    public void givePickupReward(String email, int xp, int distance, Long orderId) {
        // 1) 회원 프로필 조회
        MemberProfile profile = memberProfileRepository.findByAccountEmail(email)
                .orElseThrow(() -> new BusinessException("MEMBER_NOT_FOUND", "회원을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        // 2) 범용 메서드를 호출하여 로직 중복 제거 및 깔끔하게 처리!
        earnReward(profile, RewardSource.EARN_PICKUP, xp, distance, orderId);
    }

    // ==========================================
    // 4. [쿠폰 조회] 프론트엔드 화면 표시용
    // ==========================================
    @Transactional(readOnly = true)
    public List<MemberCouponResponse> getMyAvailableCoupons(Long memberProfileId) {
        // 1. 유저의 '사용 안 한(isUsed=false)' 쿠폰 목록을 가져옵니다.
        List<MemberCoupon> myCoupons = memberCouponRepository.findAllByMemberProfileIdAndIsUsedFalse(memberProfileId);

        // 2. 프론트엔드에 전달할 DTO 형태로 변환합니다.
        return myCoupons.stream().map(coupon -> {
            // 연관된 쿠폰 정책(이름, 조건 등)을 찾아옵니다.
            CouponPolicy policy = couponPolicyRepository.findById(coupon.getCouponPolicyId())
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 쿠폰 정책입니다."));

            return MemberCouponResponse.builder()
                    .memberCouponId(coupon.getId())
                    .name(policy.getName())
                    .discountAmount(policy.getDiscountAmount())
                    .minOrderAmount(policy.getMinOrderAmount())
                    .expiredAt(coupon.getExpiredAt().toLocalDate()) // 시간 빼고 날짜만!
                    .build();
        }).toList();
    }
}