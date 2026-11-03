package io.github.dongyuns.jubjub.domain.owner.review.dto;

import java.time.LocalDateTime;

public record ReviewReplyResponse(
        Long replyId,
        Long reviewId,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
