package io.github.dongyuns.jubjub.domain.core.store.entity;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import org.springframework.http.HttpStatus;

import java.util.Arrays;
import java.util.Locale;

public enum StoreCategory {
    KOREAN(1, "한식", "korean"),
    CHINESE(2, "중식", "chinese"),
    JAPANESE(3, "일식", "japanese"),
    CHICKEN(4, "치킨", "chicken"),
    PIZZA(5, "피자", "pizza"),
    CAFE(6, "카페", "cafe", "coffee"),
    SNACK(7, "분식", "snack", "tteokbokki"),
    WESTERN(8, "양식", "western"),
    FAST_FOOD(9, "패스트푸드", "fastfood", "fast-food", "burger"),
    DESSERT(10, "디저트", "dessert"),
    LATE_NIGHT(11, "야식", "latenight", "late-night", "midnight");

    private final int id;
    private final String label;
    private final String[] aliases;

    StoreCategory(int id, String label, String... aliases) {
        this.id = id;
        this.label = label;
        this.aliases = aliases;
    }

    public int getId() {
        return id;
    }

    public String getLabel() {
        return label;
    }

    public static StoreCategory fromId(Integer categoryId) {
        if (categoryId == null) {
            return null;
        }

        return Arrays.stream(values())
                .filter(category -> category.id == categoryId)
                .findFirst()
                .orElseThrow(() -> new BusinessException(
                        "INVALID_STORE_CATEGORY",
                        "지원하지 않는 카테고리입니다. categoryId=" + categoryId,
                        HttpStatus.BAD_REQUEST
                ));
    }

    public static StoreCategory fromValue(String category) {
        if (category == null || category.isBlank()) {
            return null;
        }

        String normalized = normalize(category);

        return Arrays.stream(values())
                .filter(value -> value.matches(normalized))
                .findFirst()
                .orElseThrow(() -> new BusinessException(
                        "INVALID_STORE_CATEGORY",
                        "지원하지 않는 카테고리입니다. category=" + category,
                        HttpStatus.BAD_REQUEST
                ));
    }

    public static StoreCategory resolve(Integer categoryId, String category) {
        StoreCategory resolvedById = fromId(categoryId);
        StoreCategory resolvedByValue = fromValue(category);

        if (resolvedById != null && resolvedByValue != null && resolvedById != resolvedByValue) {
            throw new BusinessException(
                    "CATEGORY_FILTER_MISMATCH",
                    "categoryId와 category 값이 서로 일치하지 않습니다.",
                    HttpStatus.BAD_REQUEST
            );
        }

        if (resolvedById != null) {
            return resolvedById;
        }
        return resolvedByValue;
    }

    public static String getLabelOf(Integer categoryId) {
        StoreCategory category = fromId(categoryId);
        return category == null ? "기타" : category.label;
    }

    private boolean matches(String normalized) {
        if (normalize(label).equals(normalized) || name().toLowerCase(Locale.ROOT).equals(normalized)) {
            return true;
        }

        return Arrays.stream(aliases)
                .map(StoreCategory::normalize)
                .anyMatch(normalized::equals);
    }

    private static String normalize(String value) {
        return value.trim()
                .toLowerCase(Locale.ROOT)
                .replace(" ", "")
                .replace("_", "")
                .replace("-", "");
    }
}
