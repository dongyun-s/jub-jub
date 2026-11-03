package io.github.dongyuns.jubjub.domain.owner.store.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateStoreImageRequest(
        @NotBlank(message = "대표 이미지 URL은 필수입니다.")
        String imageUrl
) {
}
