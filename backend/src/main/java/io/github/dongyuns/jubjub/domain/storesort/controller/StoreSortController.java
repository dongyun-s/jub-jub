package io.github.dongyuns.jubjub.domain.storesort.controller;

import io.github.dongyuns.jubjub.domain.storesort.dto.SortedStoreResponse;
import io.github.dongyuns.jubjub.domain.storesort.service.StoreSortService;
import io.github.dongyuns.jubjub.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Store Sort", description = "현재 위치 기준 매장 정렬 조회 API")
@RestController
@RequestMapping("/api/v1/stores")
@RequiredArgsConstructor
public class StoreSortController {

    private final StoreSortService storeSortService;

    @Operation(
            summary = "현재 위치 기준 매장 정렬 조회",
            description = "현재 위치 기준 반경 2km 이내 매장을 거리순 또는 리뷰 평점순으로 조회합니다."
    )
    @GetMapping("/sorted")
    public ApiResponse<List<SortedStoreResponse>> getSortedStores(
            @RequestParam String sortBy,
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) String category
    ) {
        List<SortedStoreResponse> response = storeSortService.getStoresWithinRadius(
                sortBy,
                latitude,
                longitude,
                categoryId,
                category
        );
        return ApiResponse.success(response);
    }
}
