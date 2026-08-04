package io.github.dongyuns.jubjub.domain.shared.external.s3;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.List;

@ConfigurationProperties(prefix = "app.s3")
public record S3Properties(
        String accessKey,
        String secretKey,
        String region,
        String bucket,
        String publicBaseUrl,
        Duration presignDuration,
        Long maxFileSizeBytes,
        List<String> allowedContentTypes
) {
}
