package io.github.dongyuns.jubjub.domain.core.reward.service;

import io.github.dongyuns.jubjub.domain.core.coupon.service.CouponIssueService;
import io.github.dongyuns.jubjub.domain.core.reward.event.PickupCompletedEvent;
import io.github.dongyuns.jubjub.domain.core.member.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.core.member.repository.MemberProfileRepository;
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

    private final RewardService rewardService;
    private final CouponIssueService couponIssueService; //  쿠폰 발급 서비스
    private final MemberProfileRepository memberProfileRepository; //  쿠폰 발급에 필요한 유저 ID 조회를 위해

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handlePickupCompleted(PickupCompletedEvent event) {
        log.info("[RewardEventListener] 픽업 완료 이벤트 수신! 보상 지급을 시작합니다. 대상: {}", event.getEmail());

        try {
            // 1. 기존 리워드(XP, 거리) 적립 처리
            rewardService.givePickupReward(
                    event.getEmail(),
                    event.getEarnedXp(),
                    event.getWalkedDistance(),
                    event.getOrderId()
            );

            // 2. 회원 정보 조회 (쿠폰 발급 시 ID값이 필요합니다)
            MemberProfile member = memberProfileRepository.findByAccountEmail(event.getEmail())
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            // 3. 다회용기 지참 시 에코 쿠폰(200원) 발급
            // (주의: PickupCompletedEvent DTO에 다회용기 여부를 나타내는 boolean 필드가 있어야 합니다!)
            if (event.isUseMultiUseContainer()) {
                couponIssueService.issueCoupon(member.getId(), "ECO", 200);
                log.info("[RewardEventListener] 🌿 다회용기 에코 쿠폰(200원) 발급 완료!");
            }

            /* 10km 거리 보상 쿠폰 발급 로직은 중복 발급을 방지하기 위해 RewardService.earnReward() 내부로 이관되어 중앙 통제됩니다.
            // 4. 5km(5000m) 누적 달성 시 거리 보상 쿠폰(1000원) 발급 로직
            // 현재 누적 거리에서 방금 걸은 거리를 빼면 '기존 누적 거리'가 나옵니다.
            int currentTotalDistance = member.getTotalWalkingDistance();
            int previousTotalDistance = currentTotalDistance - event.getWalkedDistance();

            // 기존 거리의 5km 구간 몫과 현재 거리의 5km 구간 몫이 달라졌다면, 방금 5km 단위를 돌파한 것입니다!
            if ((previousTotalDistance / 5000) < (currentTotalDistance / 5000)) {
                couponIssueService.issueCoupon(member.getId(), "DISTANCE", 1000);
                log.info("[RewardEventListener] 🏃‍♂️ 5km 달성! 거리 보상 쿠폰(1000원) 발급 완료!");
            }
            */

            log.info("[RewardEventListener] 보상 지급 전체 프로세스 성공! 대상: {}", event.getEmail());

        } catch (Exception e) {
            log.error("[RewardEventListener] 보상 지급 중 오류 발생. 대상: {}, 원인: {}", event.getEmail(), e.getMessage());
        }
    }
}
