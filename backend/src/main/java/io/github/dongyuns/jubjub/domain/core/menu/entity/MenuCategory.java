package io.github.dongyuns.jubjub.domain.core.menu.entity;

public enum MenuCategory {

    MAIN("메인"),
    SIDE("사이드"),
    DRINK("음료"),
    DESSERT("디저트");

    private final String description;

    MenuCategory(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}