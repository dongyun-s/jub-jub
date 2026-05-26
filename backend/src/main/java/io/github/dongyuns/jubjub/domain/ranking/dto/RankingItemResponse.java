package io.github.dongyuns.jubjub.domain.ranking.dto;

import io.github.dongyuns.jubjub.domain.reward.enums.RewardTier;
import java.math.BigDecimal;

public record RankingItemResponse(
        long ranking,
        Long userId,
        String nickname,
        String profileImageUrl,
        RewardTier tier,
        String tierName,
        BigDecimal totalDistanceKm,
        int pickupCount
) {
}
