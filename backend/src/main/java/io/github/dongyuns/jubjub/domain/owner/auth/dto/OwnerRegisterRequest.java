package io.github.dongyuns.jubjub.domain.owner.auth.dto;

public record OwnerRegisterRequest(
        String storeName,
        String storePhone,
        String businessRegistrationNumber,
        String address

) {
}