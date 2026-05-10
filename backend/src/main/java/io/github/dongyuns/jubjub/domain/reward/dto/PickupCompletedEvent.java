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
    private final Long orderId;     // 주문 ID (리워드 적립 시 주문과 연관짓기 위해 필요)
    private boolean useMultiUseContainer; // 다회용기 사용 여부 (주문 생성 시 선택한 값)
}