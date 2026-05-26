package io.github.dongyuns.jubjub.domain.ranking.dto;

import io.github.dongyuns.jubjub.domain.reward.enums.RewardTier;
import java.math.BigDecimal;

public record MyRankingResponse(
        long ranking,
        long totalUsers,
        Long userId,
        String nickname,
        String profileImageUrl,
        RewardTier tier,
        String tierName,
        BigDecimal totalDistanceKm,
        int pickupCount
) {
}
