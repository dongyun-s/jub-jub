package io.github.dongyuns.jubjub.domain.customer.menu.dto;

import io.github.dongyuns.jubjub.domain.core.menu.entity.Menu;
import java.util.List;

public record MenuResponse(
        Long menuId,
        String name,
        int price,
        String description,
        boolean isSoldOut,
        int rewardXp,
        List<MenuOptionResponse> options
) {
    public static MenuResponse from(Menu menu) {
        return new MenuResponse(
                menu.getId(),
                menu.getName(),
                menu.getPrice(),
                menu.getDescription(),
                menu.isSoldOut(),
                menu.getRewardXp(),
                menu.getOptions().stream()
                        .map(MenuOptionResponse::from)
                        .toList()
        );
    }
}