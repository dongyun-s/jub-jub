package io.github.dongyuns.jubjub.domain.customer.store.sort.dto;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import org.springframework.http.HttpStatus;

import java.util.Arrays;

public enum StoreSortType {
    DISTANCE,
    RATING;

    public static StoreSortType from(String value) {
        if (value == null || value.isBlank()) {
            throw new BusinessException(
                    "STORE_SORT_TYPE_REQUIRED",
                    "sortBy 값은 필수입니다. DISTANCE 또는 RATING을 사용해 주세요.",
                    HttpStatus.BAD_REQUEST
            );
        }

        return Arrays.stream(values())
                .filter(type -> type.name().equalsIgnoreCase(value.trim()))
                .findFirst()
                .orElseThrow(() -> new BusinessException(
                        "INVALID_STORE_SORT_TYPE",
                        "지원하지 않는 정렬 방식입니다. sortBy=" + value,
                        HttpStatus.BAD_REQUEST
                ));
    }
}
