package io.github.dongyuns.jubjub.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @Bean
    RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }

    @Bean
    ObjectMapper objectMapper() {
        // Java time 등 기본 모듈을 같이 등록해 PortOne 응답 파싱에 바로 사용한다.
        return new ObjectMapper().findAndRegisterModules();
    }
}
