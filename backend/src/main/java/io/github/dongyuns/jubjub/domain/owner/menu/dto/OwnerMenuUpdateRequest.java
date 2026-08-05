package io.github.dongyuns.jubjub.domain.owner.menu.dto;

import io.github.dongyuns.jubjub.domain.core.menu.entity.MenuCategory;

public record OwnerMenuUpdateRequest(

        String name,

        String description,

        Integer price,

        MenuCategory category,

        String imageUrl,

        Boolean isSpicy,

        Boolean isVegetarian,

        Boolean isBest

) {
}