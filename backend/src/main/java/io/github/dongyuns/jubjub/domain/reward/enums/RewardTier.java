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
    /**
     * 다음 등급을 반환하는 유틸리티 메서드
     * (마이페이지 UI 등에서 다음 목표 등급을 보여줄 때 사용합니다)
     */
    public RewardTier getNextTier() {
        int nextOrdinal = this.ordinal() + 1; // 현재 Enum의 다음 순서 인덱스를 구함
        RewardTier[] tiers = values();

        // 다음 순서가 전체 길이보다 작으면 다음 등급 반환
        if (nextOrdinal < tiers.length) {
            return tiers[nextOrdinal];
        }

        // 이미 최고 등급(LEGEND)인 경우 자기 자신을 그대로 반환
        return this;
    }

    /**
     * 다음 등급 승급까지 남은 픽업 횟수를 계산하는 유틸리티 메서드
     * @param currentPickupCount 유저의 현재 누적 픽업 횟수
     * @return 승급까지 남은 픽업 횟수 (이미 최고 등급이면 0 반환)
     */
    public static int getRemainingPickupsForNextTier(int currentPickupCount) {
        RewardTier currentTier = calculateTier(currentPickupCount); // 현재 등급 계산
        RewardTier nextTier = currentTier.getNextTier();            // 다음 등급 조회

        // 현재 등급과 다음 등급이 같다면 (최고 등급 도달 완료)
        if (currentTier == nextTier) {
            return 0;
        }

        // (다음 등급의 요구 횟수) - (현재 유저의 픽업 횟수)
        return nextTier.getRequiredPickupCount() - currentPickupCount;
    }
}