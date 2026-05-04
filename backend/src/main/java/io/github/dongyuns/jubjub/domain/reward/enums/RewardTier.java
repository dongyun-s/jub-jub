package io.github.dongyuns.jubjub.domain.reward.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RewardTier {

    BRONZE("브론즈", 0, 0),
    SILVER("실버", 5, 1),
    GOLD("골드", 10, 3),
    PLATINUM("플래티넘", 30, 5),
    DIAMOND("다이아", 60, 7),
    LEGEND("레전드", 100, 10);

    private final String label;
    private final int requiredPickupCount; // 승급을 위한 누적 픽업 횟수
    private final int discountRate;        // 등급별 상시 할인율 (%)

    // 현재 픽업 횟수를 기반으로 달성 가능한 최고 등급을 계산하는 유틸리티 메서드
    public static RewardTier calculateTier(int totalPickupCount) {
        RewardTier highestTier = BRONZE;
        for (RewardTier tier : values()) {
            if (totalPickupCount >= tier.getRequiredPickupCount()) {
                highestTier = tier;
            }
        }
        return highestTier;
    }
}