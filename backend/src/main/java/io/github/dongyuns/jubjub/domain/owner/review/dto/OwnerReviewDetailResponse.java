package io.github.dongyuns.jubjub.domain.owner.review.dto;

import java.time.LocalDateTime;
import java.util.List;

public record OwnerReviewDetailResponse(
        Long reviewId,
        Long orderId,
        String orderNumber,
        List<String> menuNames,
        String reviewerName,
        Integer overallRating,
        Integer tasteRating,
        Integer packagingRating,
        Integer timeRating,
        String content,
        LocalDateTime createdAt,
        List<String> imagePaths,
        ReviewReplyResponse reply
) {
}
