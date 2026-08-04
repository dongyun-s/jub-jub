package io.github.dongyuns.jubjub.domain.owner.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OwnerSignupRequest(

        String email,

        String password,

        String ownerName,

        String ownerPhone,

        String storeName,

        String storePhone,

        String businessRegistrationNumber,

        @NotBlank(message = "매장 주소는 필수입니다.")
        String address,

        @NotNull(message = "매장 카테고리는 필수입니다.")
        Integer categoryId,

        Long logId  // 신규 이메일 인증 시 필요 (기존 이메일은 null)

) {
}
