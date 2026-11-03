package io.github.dongyuns.jubjub.domain.owner.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OwnerRegisterRequest(
        String storeName,
        String storePhone,
        String businessRegistrationNumber,
        @NotBlank(message = "매장 주소는 필수입니다.")
        String address,
        @NotNull(message = "매장 카테고리는 필수입니다.")
        Integer categoryId

) {
}
