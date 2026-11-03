package io.github.dongyuns.jubjub.domain.customer.store.dto;

import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.core.store.entity.StoreCategory;

public record StoreListResponse(
        Long storeId,
        String name,
        Integer categoryId,
        String categoryName,
        int cookingTimeMinutes,
        int minOrderAmount,
        Double latitude,
        Double longitude,
        String imageUrl
) {
    public static StoreListResponse from(Store store, String imageUrl) {
        return new StoreListResponse(
                store.getId(),
                store.getName(),
                store.getCategoryId(),
                StoreCategory.getLabelOf(store.getCategoryId()),
                store.getCookingTimeMinutes(),
                store.getMinOrderAmount(),
                store.getLatitude(),
                store.getLongitude(),
                imageUrl
        );
    }
}
