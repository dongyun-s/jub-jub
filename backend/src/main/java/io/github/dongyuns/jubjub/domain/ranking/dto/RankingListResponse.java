package io.github.dongyuns.jubjub.domain.ranking.dto;

import java.util.List;

public record RankingListResponse(
        int page,
        int size,
        long totalUsers,
        List<RankingItemResponse> rankings
) {
}
