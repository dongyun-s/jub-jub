package io.github.dongyuns.jubjub.domain.owner.store.dto;

import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.core.store.entity.StoreCategory;

public record OwnerStoreResponse(
        Long storeId,
        String name,
        String address,
        String phoneNumber,
        Integer categoryId,
        String categoryName,
        Double latitude,
        Double longitude,
        String status,
        Integer cookingTimeMinutes
) {
    public static OwnerStoreResponse from(Store store) {
        return new OwnerStoreResponse(
                store.getId(),
                store.getName(),
                store.getAddress(),
                store.getPhoneNumber(),
                store.getCategoryId(),
                StoreCategory.getLabelOf(store.getCategoryId()),
                store.getLatitude(),
                store.getLongitude(),
                store.getStatus(),
                store.getCookingTimeMinutes()
        );
    }
}
