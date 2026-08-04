package io.github.dongyuns.jubjub.domain.owner.review.dto;

import java.util.List;

public record ReviewInsightResponse(
        Long reviewId,
        String summary,
        List<String> highlights
) {
}
