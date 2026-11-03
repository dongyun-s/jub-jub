package io.github.dongyuns.jubjub.domain.owner.store.controller;

import io.github.dongyuns.jubjub.common.response.ApiResponse;
import io.github.dongyuns.jubjub.domain.owner.store.dto.OwnerStoreResponse;
import io.github.dongyuns.jubjub.domain.owner.store.dto.UpdateStoreOriginRequest;
import io.github.dongyuns.jubjub.domain.owner.store.dto.UpdateStoreMinOrderRequest;
import io.github.dongyuns.jubjub.domain.owner.store.dto.UpdateStoreCookingTimeRequest;
import io.github.dongyuns.jubjub.domain.owner.store.dto.UpdateStoreImageRequest;
import io.github.dongyuns.jubjub.domain.owner.store.dto.UpdateStoreInfoRequest;
import io.github.dongyuns.jubjub.domain.owner.store.dto.UpdateStoreLocationRequest;
import io.github.dongyuns.jubjub.domain.owner.store.dto.UpdateStoreStatusRequest;
import io.github.dongyuns.jubjub.domain.owner.store.service.OwnerStoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/owner/store")
@RequiredArgsConstructor
public class OwnerStoreController {

    private final OwnerStoreService ownerStoreService;

    @GetMapping
    public ApiResponse<OwnerStoreResponse> getMyStore(Authentication authentication) {
        return ApiResponse.success(ownerStoreService.getMyStore(authentication.getName()));
    }

    @PatchMapping("/status")
    public ApiResponse<OwnerStoreResponse> updateStatus(
            Authentication authentication,
            @Valid @RequestBody UpdateStoreStatusRequest request
    ) {
        return ApiResponse.success(ownerStoreService.updateStatus(authentication.getName(), request));
    }

    @PatchMapping
    public ApiResponse<OwnerStoreResponse> updateLocationAndCategory(
            Authentication authentication,
            @Valid @RequestBody UpdateStoreLocationRequest request
    ) {
        return ApiResponse.success(
                ownerStoreService.updateLocationAndCategory(authentication.getName(), request)
        );
    }

    @PatchMapping("/image")
    public ApiResponse<OwnerStoreResponse> updateImage(
            Authentication authentication,
            @Valid @RequestBody UpdateStoreImageRequest request
    ) {
        return ApiResponse.success(ownerStoreService.updateImage(authentication.getName(), request));
    }

    @PatchMapping("/cooking-time")
    public ApiResponse<OwnerStoreResponse> updateCookingTime(
            Authentication authentication,
            @Valid @RequestBody UpdateStoreCookingTimeRequest request
    ) {
        return ApiResponse.success(ownerStoreService.updateCookingTime(authentication.getName(), request));
    }

    @PatchMapping("/origin")
    public ApiResponse<OwnerStoreResponse> updateOrigin(
            Authentication authentication,
            @Valid @RequestBody UpdateStoreOriginRequest request
    ) {
        return ApiResponse.success(ownerStoreService.updateOrigin(authentication.getName(), request));
    }

    @PatchMapping("/min-order")
    public ApiResponse<OwnerStoreResponse> updateMinOrder(
            Authentication authentication,
            @Valid @RequestBody UpdateStoreMinOrderRequest request
    ) {
        return ApiResponse.success(ownerStoreService.updateMinOrder(authentication.getName(), request));
    }

    @PatchMapping("/info")
    public ApiResponse<OwnerStoreResponse> updateInfo(
            Authentication authentication,
            @Valid @RequestBody UpdateStoreInfoRequest request
    ) {
        return ApiResponse.success(ownerStoreService.updateInfo(authentication.getName(), request));
    }
}
