package io.github.dongyuns.jubjub.domain.owner.review.dto;

public record RatingDistributionResponse(
        long oneStar,
        long twoStar,
        long threeStar,
        long fourStar,
        long fiveStar
) {
}
