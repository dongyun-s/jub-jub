package io.github.dongyuns.jubjub.domain.customer.store.dto;

import io.github.dongyuns.jubjub.domain.customer.menu.dto.MenuResponse;
import java.util.List;

public record StoreDetailResponse(
        Long storeId,
        String name,
        String address,
        String phoneNumber,
        String originInfo,
        int cookingTimeMinutes,
        int minOrderAmount,
        List<MenuResponse> menus, // 이 매장에 속한 메뉴들이 리스트로 들어갑니다!
        String imageUrl,
        String operatingHours,
        String notice
) {}
