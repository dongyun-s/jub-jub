package io.github.dongyuns.jubjub.domain.owner.review.dto;

public record OwnerReviewSummaryResponse(
        double averageRating,
        long totalReviewCount,
        long unansweredReviewCount,
        long photoReviewCount,
        RatingDistributionResponse ratingDistribution
) {
}
