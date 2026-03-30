package io.github.dongyuns.jubjub.domain.store.dto;

import io.github.dongyuns.jubjub.domain.store.entity.MenuOption;

public record MenuOptionResponse(
        Long optionId,
        String name,
        int additionalPrice,
        boolean isRequired
) {
    public static MenuOptionResponse from(MenuOption option) {
        return new MenuOptionResponse(
                option.getId(),
                option.getName(),
                option.getAdditionalPrice(),
                option.isRequired()
        );
    }
}