package io.github.dongyuns.jubjub.domain.customer.review.dto;

import java.time.LocalDateTime;

public record OwnerReplyResponse(
        Long replyId,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
