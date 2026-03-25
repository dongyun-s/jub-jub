package io.github.dongyuns.jubjub.domain.store.dto;

import io.github.dongyuns.jubjub.domain.store.entity.Menu;

public record MenuResponse(
        Long menuId,
        String name,
        int price,
        String description,
        boolean isSoldOut,
        int rewardXp
) {
    public static MenuResponse from(Menu menu) {
        return new MenuResponse(
                menu.getId(),
                menu.getName(),
                menu.getPrice(),
                menu.getDescription(),
                menu.isSoldOut(),
                menu.getRewardXp()
        );
    }
}