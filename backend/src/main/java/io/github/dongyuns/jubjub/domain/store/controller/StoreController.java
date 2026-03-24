package io.github.dongyuns.jubjub.domain.store.controller;

import io.github.dongyuns.jubjub.domain.store.dto.StoreDetailResponse;
import io.github.dongyuns.jubjub.domain.store.dto.StoreListResponse;
import io.github.dongyuns.jubjub.domain.store.service.StoreService;
import io.github.dongyuns.jubjub.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Store", description = "매장 및 메뉴 관련 API")
@RestController
@RequestMapping("/api/v1/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;

    @Operation(summary = "매장 목록 조회", description = "홈 화면에 노출할 매장 리스트를 가져옵니다.")
    @GetMapping
    public ApiResponse<List<StoreListResponse>> getAllStores() {
        List<StoreListResponse> response = storeService.getAllStores();
        return ApiResponse.success(response);
    }

    @Operation(summary = "매장 상세 및 메뉴 조회", description = "특정 매장의 기본 정보와 판매 중인 메뉴 목록을 가져옵니다.")
    @GetMapping("/{storeId}")
    public ApiResponse<StoreDetailResponse> getStoreDetail(@PathVariable Long storeId) {
        StoreDetailResponse response = storeService.getStoreDetail(storeId);
        return ApiResponse.success(response);
    }
}