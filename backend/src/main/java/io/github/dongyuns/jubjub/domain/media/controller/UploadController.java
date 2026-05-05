package io.github.dongyuns.jubjub.domain.media.controller;

import io.github.dongyuns.jubjub.domain.media.dto.PresignedUploadRequest;
import io.github.dongyuns.jubjub.domain.media.dto.PresignedUploadResponse;
import io.github.dongyuns.jubjub.domain.media.service.S3PresignedUploadService;
import io.github.dongyuns.jubjub.global.common.ApiResponse;
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
