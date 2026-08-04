package io.github.dongyuns.jubjub.domain.owner.auth.dto;

public record OwnerSignupRequest(

        String email,

        String password,

        String ownerName,

        String ownerPhone,

        String storeName,

        String storePhone,

        String businessRegistrationNumber,

        String address,

        Long logId  // 신규 이메일 인증 시 필요 (기존 이메일은 null)

) {
}