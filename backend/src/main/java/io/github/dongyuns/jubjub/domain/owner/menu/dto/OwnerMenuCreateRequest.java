package io.github.dongyuns.jubjub.domain.owner.menu.dto;

import io.github.dongyuns.jubjub.domain.core.menu.entity.MenuCategory;

public record OwnerMenuCreateRequest(

        String name,

        String description,

        Integer price,

        MenuCategory category,

        Boolean isSpicy,

        Boolean isVegetarian,

        Boolean isBest

) {
}