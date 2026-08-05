package io.github.dongyuns.jubjub.domain.owner.menu.dto;

import io.github.dongyuns.jubjub.domain.core.menu.entity.MenuCategory;

public record OwnerMenuListResponse(

        Long menuId,

        String name,

        Integer price,

        String description,

        MenuCategory category,

        String imageUrl,

        Boolean isSpicy,

        Boolean isVegetarian,

        Boolean isBest,

        Boolean isSoldOut

) {
}