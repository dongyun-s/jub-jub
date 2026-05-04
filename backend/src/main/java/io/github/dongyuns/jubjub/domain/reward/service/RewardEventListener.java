package io.github.dongyuns.jubjub.domain.reward.service;

import io.github.dongyuns.jubjub.domain.reward.dto.PickupCompletedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class RewardEventListener {

    private final RewardService rewardService;
    /**
     * 픽업 완료 이벤트를 구독하여 리워드 적립 로직을 실행합니다.
     */
    @Async // 리워드 처리가 실패해도 주문 완료 로직에 영향을 주지 않도록 비동기 처리
    @EventListener
    @Transactional
    public void handlePickupCompleted(PickupCompletedEvent event) {
        // 서비스 계층에 리워드 적립 위임
        rewardService.givePickupReward(event.getEmail(), event.getEarnedXp(), event.getWalkedDistance());
    }
}