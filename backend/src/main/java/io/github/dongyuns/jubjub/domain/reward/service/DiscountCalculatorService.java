package io.github.dongyuns.jubjub.domain.reward.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.reward.dto.DiscountCalculateRequest;
import io.github.dongyuns.jubjub.domain.reward.dto.DiscountCalculateResponse;
import io.github.dongyuns.jubjub.domain.reward.entity.CouponPolicy;
import io.github.dongyuns.jubjub.domain.reward.entity.MemberCoupon;
import io.github.dongyuns.jubjub.domain.reward.enums.RewardTier;
import io.github.dongyuns.jubjub.domain.reward.repository.CouponPolicyRepository;
import io.github.dongyuns.jubjub.domain.reward.repository.MemberCouponRepository;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.user.repository.MemberProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DiscountCalculatorService {

    private final MemberProfileRepository memberProfileRepository;
    private final MemberCouponRepository memberCouponRepository;
    private final CouponPolicyRepository couponPolicyRepository;

    /**
     * 최종 결제 금액을 계산합니다.
     * (조회용이므로 Transactional(readOnly = true) 적용. 실제 사용 처리는 Order 단계에서 진행)
     */
    @Transactional(readOnly = true)
    public DiscountCalculateResponse calculateDiscount(String accountEmail, DiscountCalculateRequest request) {

        // 1. 유저 정보 조회
        MemberProfile profile = memberProfileRepository.findByAccountEmail(accountEmail)
                .orElseThrow(() -> new BusinessException("MEMBER_NOT_FOUND", "회원 정보를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        int originalAmount = request.getOriginalOrderAmount();

        // 2. 등급 할인 계산 (정률)
        RewardTier currentTier = RewardTier.calculateTier(profile.getOrderCount());

        // 퍼센트 계산 (예: 15000원 * (3 / 100.0) = 450원)
        int tierDiscountAmount = (int) (originalAmount * (currentTier.getDiscountRate() / 100.0));

        // 3. 쿠폰 할인 계산 (정액)
        int couponDiscountAmount = 0;
        List<Long> couponIds = request.getMemberCouponIds();

        if (couponIds != null && !couponIds.isEmpty()) {
            for (Long couponId : couponIds) {
                MemberCoupon memberCoupon = memberCouponRepository.findById(couponId)
                        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 쿠폰입니다."));

                // [보안 검증 4콤보!] 프론트엔드의 조작을 막기 위한 백엔드의 깐깐한 검증
                if (!memberCoupon.getMemberProfileId().equals(profile.getId())) {
                    throw new IllegalArgumentException("본인의 쿠폰만 사용할 수 있습니다.");
                }
                if (memberCoupon.getIsUsed()) {
                    throw new IllegalArgumentException("이미 사용된 쿠폰입니다.");
                }
                if (memberCoupon.getExpiredAt() != null && memberCoupon.getExpiredAt().isBefore(LocalDateTime.now())) {
                    throw new IllegalArgumentException("유효기간이 만료된 쿠폰입니다.");
                }

                CouponPolicy policy = couponPolicyRepository.findById(memberCoupon.getCouponPolicyId())
                        .orElseThrow(() -> new IllegalArgumentException("쿠폰 정책을 찾을 수 없습니다."));

                // 쿠폰 할인 금액이 현재 남은 결제 대상 금액보다 크면 사용 불가 처리
                if (originalAmount < policy.getDiscountAmount()) {
                    throw new IllegalArgumentException("상품 금액보다 큰 할인 금액의 쿠폰은 사용할 수 없습니다. " +
                            "(상품 금액: " + originalAmount + "원, 쿠폰 할인액: " + policy.getDiscountAmount() + "원)");
                }

                // 검증 통과 시 할인 금액 합산
                couponDiscountAmount += policy.getDiscountAmount();
            }
        }

        // 4. 최종 결제 금액 산출 (0원 밑으로 떨어지는 것 방지)
        int finalAmount = originalAmount - tierDiscountAmount - couponDiscountAmount;
        if (finalAmount < 0) {
            finalAmount = 0;
        }

        // 5. 영수증(DTO) 발행
        return DiscountCalculateResponse.builder()
                .originalAmount(originalAmount)
                .tierDiscountAmount(tierDiscountAmount)
                .couponDiscountAmount(couponDiscountAmount)
                .finalPaymentAmount(finalAmount)
                .build();
    }
}