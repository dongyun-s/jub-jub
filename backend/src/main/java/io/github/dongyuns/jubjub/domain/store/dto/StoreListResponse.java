package io.github.dongyuns.jubjub.domain.store.dto;

import io.github.dongyuns.jubjub.domain.store.entity.Store;

public record StoreListResponse(
        Long storeId,
        String name,
        String category,
        int cookingTimeMinutes,
        int minOrderAmount,
        Double latitude,
        Double longitude
) {
    // Entity를 DTO로 변환해주는 마법의 도구
    public static StoreListResponse from(Store store) {
        return new StoreListResponse(
                store.getId(),
                store.getName(),
                store.getCategory(),
                store.getCookingTimeMinutes(),
                store.getMinOrderAmount(),
                store.getLatitude(),
                store.getLongitude()
        );
    }
}