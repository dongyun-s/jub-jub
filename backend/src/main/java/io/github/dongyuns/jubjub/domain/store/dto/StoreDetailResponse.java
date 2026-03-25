package io.github.dongyuns.jubjub.domain.store.dto;

import java.util.List;

public record StoreDetailResponse(
        Long storeId,
        String name,
        String address,
        int cookingTimeMinutes,
        int minOrderAmount,
        List<MenuResponse> menus // 이 매장에 속한 메뉴들이 리스트로 들어갑니다!
) {}