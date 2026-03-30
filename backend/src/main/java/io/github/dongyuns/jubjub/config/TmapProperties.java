package io.github.dongyuns.jubjub.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "tmap")
public class TmapProperties {
    private String appKey;
    private String pedestrianUrl;
}