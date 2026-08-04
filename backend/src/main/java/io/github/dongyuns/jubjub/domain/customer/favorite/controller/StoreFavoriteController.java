package io.github.dongyuns.jubjub.domain.customer.favorite.controller;

import io.github.dongyuns.jubjub.domain.customer.favorite.dto.FavoriteStoreResponse;
import io.github.dongyuns.jubjub.domain.customer.favorite.service.StoreFavoriteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Store Favorite", description = "매장 찜하기 API")
public class StoreFavoriteController {

    private final StoreFavoriteService favoriteService;

    @PostMapping("/stores/{storeId}/favorites")
    @Operation(summary = "매장 찜하기/취소 토글", description = "하트 버튼을 누를 때마다 찜하기/취소가 반복됩니다.")
    public ResponseEntity<String> toggleFavorite(Authentication authentication, @PathVariable Long storeId) {
        String result = favoriteService.toggleFavorite(authentication.getName(), storeId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/favorites")
    @Operation(summary = "내 찜 목록 조회", description = "프론트엔드 UI 시안에 맞춘 찜 목록 데이터를 반환합니다.")
    public ResponseEntity<List<FavoriteStoreResponse>> getMyFavorites(Authentication authentication) {
        List<FavoriteStoreResponse> response = favoriteService.getMyFavorites(authentication.getName());
        return ResponseEntity.ok(response);
    }
}