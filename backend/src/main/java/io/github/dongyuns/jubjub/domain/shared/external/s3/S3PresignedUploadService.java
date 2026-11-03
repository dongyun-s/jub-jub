package io.github.dongyuns.jubjub.domain.shared.external.s3;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.shared.external.s3.S3Properties;
import io.github.dongyuns.jubjub.domain.customer.profile.dto.PresignedUploadRequest;
import io.github.dongyuns.jubjub.domain.customer.profile.dto.PresignedUploadResponse;
import io.github.dongyuns.jubjub.domain.customer.profile.dto.UploadType;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3PresignedUploadService {

    private static final List<String> DEFAULT_ALLOWED_CONTENT_TYPES = List.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );
    private static final long DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024L;
    private static final Duration DEFAULT_PRESIGN_DURATION = Duration.ofMinutes(10);

    private final S3Presigner s3Presigner;
    private final S3Properties s3Properties;

    public PresignedUploadResponse createPresignedUpload(PresignedUploadRequest request) {
        validateRequest(request);

        String objectKey = buildObjectKey(
                request.uploadType(),
                request.originalFileName(),
                request.contentType()
        );
        Duration signatureDuration = s3Properties.presignDuration() != null
                ? s3Properties.presignDuration()
                : DEFAULT_PRESIGN_DURATION;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(s3Properties.bucket())
                .key(objectKey)
                .contentType(request.contentType())
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(signatureDuration)
                .putObjectRequest(putObjectRequest)
                .build();

        PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);
        Instant expiresAt = Instant.now().plus(signatureDuration);

        return new PresignedUploadResponse(
                objectKey,
                presignedRequest.url().toString(),
                buildPublicFileUrl(objectKey),
                expiresAt
        );
    }

    private void validateRequest(PresignedUploadRequest request) {
        List<String> allowedContentTypes = s3Properties.allowedContentTypes() == null || s3Properties.allowedContentTypes().isEmpty()
                ? DEFAULT_ALLOWED_CONTENT_TYPES
                : s3Properties.allowedContentTypes();

        if (!allowedContentTypes.contains(request.contentType())) {
            throw new BusinessException(
                    "UNSUPPORTED_CONTENT_TYPE",
                    "지원하지 않는 이미지 형식입니다.",
                    HttpStatus.BAD_REQUEST
            );
        }

        long maxFileSize = s3Properties.maxFileSizeBytes() != null
                ? s3Properties.maxFileSizeBytes()
                : DEFAULT_MAX_FILE_SIZE_BYTES;

        if (request.fileSize() > maxFileSize) {
            throw new BusinessException(
                    "FILE_TOO_LARGE",
                    "이미지 용량은 10MB 이하여야 합니다.",
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    private String buildObjectKey(UploadType uploadType, String originalFileName, String contentType) {
        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        String extension = resolveExtension(originalFileName, contentType);
        String directory = switch (uploadType) {
            case PROFILE -> "profiles";
            case REVIEW -> "reviews";
            case STORE -> "stores";
            case MENU -> "menus";
        };
        return "%s/%s/%s.%s".formatted(directory, datePath, UUID.randomUUID(), extension);
    }

    private String resolveExtension(String originalFileName, String contentType) {
        String normalizedFileName = originalFileName == null ? "" : originalFileName.trim();
        String extension = StringUtils.getFilenameExtension(normalizedFileName);
        if (StringUtils.hasText(extension)) {
            return extension.toLowerCase(Locale.ROOT);
        }

        return switch (contentType) {
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            case "image/gif" -> "gif";
            default -> "bin";
        };
    }

    private String buildPublicFileUrl(String objectKey) {
        if (StringUtils.hasText(s3Properties.publicBaseUrl())) {
            String baseUrl = s3Properties.publicBaseUrl().endsWith("/")
                    ? s3Properties.publicBaseUrl().substring(0, s3Properties.publicBaseUrl().length() - 1)
                    : s3Properties.publicBaseUrl();
            return "%s/%s".formatted(baseUrl, objectKey);
        }

        URI uri = URI.create("https://%s.s3.%s.amazonaws.com/%s".formatted(
                s3Properties.bucket(),
                s3Properties.region(),
                objectKey
        ));
        return uri.toString();
    }
}
