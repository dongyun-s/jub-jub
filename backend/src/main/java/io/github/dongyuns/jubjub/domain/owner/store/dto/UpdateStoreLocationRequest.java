package io.github.dongyuns.jubjub.domain.owner.store.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateStoreLocationRequest(
        @NotBlank(message = "매장 주소는 필수입니다.")
        String address,
        @NotNull(message = "매장 카테고리는 필수입니다.")
        Integer categoryId
) {
}
