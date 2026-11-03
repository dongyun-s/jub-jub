package io.github.dongyuns.jubjub.domain.owner.review.dto;

import java.time.LocalDateTime;
import java.util.List;

public record OwnerReviewListResponse(
        List<ReviewItem> reviews,
        int count
) {
    public record ReviewItem(
            Long reviewId,
            Long orderId,
            String reviewerName,
            Integer overallRating,
            String content,
            LocalDateTime createdAt,
            List<String> imagePaths,
            boolean answered,
            String replyContent
    ) {
    }
}
