package io.github.dongyuns.jubjub.domain.customer.profile.controller;

import io.github.dongyuns.jubjub.domain.customer.profile.dto.ProfileImageResponse;
import io.github.dongyuns.jubjub.domain.customer.profile.dto.ProfileImageUpsertRequest;
import io.github.dongyuns.jubjub.domain.core.media.service.MediaCrudService;
import io.github.dongyuns.jubjub.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Profile Image", description = "마이페이지 프로필 사진 관리 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/profile-image")
public class ProfileImageController {

    private final MediaCrudService mediaCrudService;

    @Operation(summary = "내 프로필 사진 조회")
    @GetMapping
    public ApiResponse<ProfileImageResponse> getMyProfileImage(Authentication authentication) {
        return ApiResponse.success(mediaCrudService.getMyProfileImage(authentication.getName()));
    }

    @Operation(summary = "내 프로필 사진 등록")
    @PostMapping
    public ApiResponse<ProfileImageResponse> createMyProfileImage(
            Authentication authentication,
            @RequestBody @Valid ProfileImageUpsertRequest request
    ) {
        return ApiResponse.success(mediaCrudService.createMyProfileImage(authentication.getName(), request.imagePath()));
    }

    @Operation(summary = "내 프로필 사진 수정")
    @PutMapping
    public ApiResponse<ProfileImageResponse> updateMyProfileImage(
            Authentication authentication,
            @RequestBody @Valid ProfileImageUpsertRequest request
    ) {
        return ApiResponse.success(mediaCrudService.updateMyProfileImage(authentication.getName(), request.imagePath()));
    }

    @Operation(summary = "내 프로필 사진 삭제")
    @DeleteMapping
    public ApiResponse<Void> deleteMyProfileImage(Authentication authentication) {
        mediaCrudService.deleteMyProfileImage(authentication.getName());
        return ApiResponse.success(null);
    }
}
