package io.github.dongyuns.jubjub.domain.owner.review.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReviewReplyRequest(
        @NotBlank(message = "답글 내용을 입력해주세요.")
        @Size(max = 2000, message = "답글은 2000자 이하로 입력해주세요.")
        String content
) {
}
