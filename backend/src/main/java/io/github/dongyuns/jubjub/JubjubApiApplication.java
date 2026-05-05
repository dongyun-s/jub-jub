package io.github.dongyuns.jubjub;

import io.github.dongyuns.jubjub.domain.media.config.S3Properties;
import io.github.dongyuns.jubjub.domain.route.config.TmapProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({TmapProperties.class, S3Properties.class})
public class JubjubApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(JubjubApiApplication.class, args);
    }
}
