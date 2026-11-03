package io.github.dongyuns.jubjub.domain.customer.profile.controller;

import io.github.dongyuns.jubjub.domain.customer.profile.dto.PresignedUploadRequest;
import io.github.dongyuns.jubjub.domain.customer.profile.dto.PresignedUploadResponse;
import io.github.dongyuns.jubjub.domain.shared.external.s3.S3PresignedUploadService;
import io.github.dongyuns.jubjub.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/uploads")
public class UploadController {

    private final S3PresignedUploadService s3PresignedUploadService;

    @PostMapping("/presigned-url")
    public ApiResponse<PresignedUploadResponse> createPresignedUpload(
            @RequestBody @Valid PresignedUploadRequest request
    ) {
        return ApiResponse.success(s3PresignedUploadService.createPresignedUpload(request));
    }
}
