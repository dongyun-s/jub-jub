package io.github.dongyuns.jubjub.domain.customer.store.sort.dto;

import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.core.store.entity.StoreCategory;

public record SortedStoreResponse(
        Long storeId,
        String name,
        Integer categoryId,
        String categoryName,
        int cookingTimeMinutes,
        int minOrderAmount,
        Double latitude,
        Double longitude,
        double distanceMeters,
        double averageRating,
        long reviewCount,
        String imageUrl
) {
    public static SortedStoreResponse of(Store store, double distanceMeters, double averageRating, long reviewCount, String imageUrl) {
        return new SortedStoreResponse(
                store.getId(),
                store.getName(),
                store.getCategoryId(),
                StoreCategory.getLabelOf(store.getCategoryId()),
                store.getCookingTimeMinutes(),
                store.getMinOrderAmount(),
                store.getLatitude(),
                store.getLongitude(),
                distanceMeters,
                averageRating,
                reviewCount,
                imageUrl
        );
    }
}
