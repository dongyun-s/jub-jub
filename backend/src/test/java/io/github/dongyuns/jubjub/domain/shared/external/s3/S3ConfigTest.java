package io.github.dongyuns.jubjub.domain.shared.external.s3;

import org.junit.jupiter.api.Test;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.time.Duration;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class S3ConfigTest {

    @Test
    void createsPresignerWithoutStaticAccessKeys() {
        S3Properties properties = new S3Properties(
                "ap-southeast-2",
                "jubjub-images-prod-294427323709-ap-southeast-2-an",
                "https://images.example.com",
                Duration.ofMinutes(10),
                10 * 1024 * 1024L,
                List.of("image/jpeg", "image/png")
        );

        try (S3Presigner presigner = new S3Config().s3Presigner(properties)) {
            assertThat(presigner).isNotNull();
        }
    }
}
