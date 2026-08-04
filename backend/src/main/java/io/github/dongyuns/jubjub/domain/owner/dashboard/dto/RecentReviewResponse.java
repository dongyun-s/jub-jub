package io.github.dongyuns.jubjub.domain.owner.dashboard.dto;

import io.github.dongyuns.jubjub.domain.core.review.entity.Review;
import java.time.LocalDateTime;

public record RecentReviewResponse(
        Long reviewId,
        Integer overallRating,
        String content,
        LocalDateTime createdAt
) {
    public static RecentReviewResponse from(Review review) {
        return new RecentReviewResponse(
                review.getReviewId(),
                review.getOverallRating(),
                review.getContent(),
                review.getCreatedAt()
        );
    }
}
