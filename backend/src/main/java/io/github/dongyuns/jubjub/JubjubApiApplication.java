package io.github.dongyuns.jubjub;

import io.github.dongyuns.jubjub.common.config.CorsProperties;
import io.github.dongyuns.jubjub.domain.shared.external.s3.S3Properties;
import io.github.dongyuns.jubjub.domain.shared.external.tmap.TmapProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling // 스케줄러 기능 활성화!
@EnableAsync // 비동기 처리를 활성화하여 리워드 로직이 별도 스레드에서 실행되게 함
@EnableJpaAuditing // JPA Auditing 활성화: BaseTimeEntity가 작동하기 위해 필수
@SpringBootApplication
@EnableConfigurationProperties({CorsProperties.class, TmapProperties.class, S3Properties.class})
public class JubjubApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(JubjubApiApplication.class, args);
    }
}
