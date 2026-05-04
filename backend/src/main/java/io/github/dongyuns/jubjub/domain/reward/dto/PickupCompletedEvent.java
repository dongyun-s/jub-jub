package io.github.dongyuns.jubjub.domain.reward.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
/**
 * 픽업 완료 시 발행되는 리워드 적립용 이벤트 객체
 */
@Getter
@RequiredArgsConstructor
public class PickupCompletedEvent {
    private final String email;           // 사용자 식별값
    private final int earnedXp;          // 이번 주문으로 얻은 경험치
    private final int walkedDistance;    // 이번에 걸은 거리 (m)
}