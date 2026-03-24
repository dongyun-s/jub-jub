package io.github.dongyuns.jubjub.domain.store.dto;

import io.github.dongyuns.jubjub.domain.store.entity.Store;

public record StoreListResponse(
        Long storeId,
        String name,
        Integer categoryId,
        int cookingTimeMinutes,
        int minOrderAmount,
        Double latitude,
        Double longitude
) {
    public static StoreListResponse from(Store store) {
        return new StoreListResponse(
                store.getId(),
                store.getName(),
                store.getCategoryId(),
                store.getCookingTimeMinutes(),
                store.getMinOrderAmount(),
                store.getLatitude(),
                store.getLongitude()
        );
    }
}