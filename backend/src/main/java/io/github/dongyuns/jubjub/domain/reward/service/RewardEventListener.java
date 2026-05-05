package io.github.dongyuns.jubjub.domain.reward.service;

import io.github.dongyuns.jubjub.domain.reward.dto.PickupCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; // 로깅을 위한 임포트
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j // 시스템에 상황을 기록(Log)하기 위해 사용합니다.
@Component
@RequiredArgsConstructor
public class RewardEventListener {

    private final RewardService rewardService;

    // 픽업 완료 이벤트를 구독하여 리워드 적립 로직을 실행합니다.
    @Async // 리워드 처리가 실패해도 주문 완료 로직에 영향을 주지 않도록 비동기 처리
    // @EventListener 대신, 주문 트랜잭션이 완벽히 끝난 후(AFTER_COMMIT)에 작동하도록 변경
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handlePickupCompleted(PickupCompletedEvent event) {
        log.info("[RewardEventListener] 픽업 완료 이벤트 수신! 보상 지급을 시작합니다. 대상: {}", event.getEmail());

        try {
            rewardService.givePickupReward(
                    event.getEmail(),
                    event.getEarnedXp(),
                    event.getWalkedDistance(),
                    event.getOrderId() // 주문 추적을 위해 추가된 ID
            );
            log.info("[RewardEventListener] 보상 지급 성공! 대상: {}", event.getEmail());

        } catch (Exception e) {
            // 비동기 실행 중 에러가 나더라도 주문 로직에 영향을 주지 않도록 방어
            log.error("[RewardEventListener] 보상 지급 중 오류 발생. 대상: {}, 원인: {}", event.getEmail(), e.getMessage());
        }
    }
}