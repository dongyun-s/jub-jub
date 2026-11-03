package io.github.dongyuns.jubjub.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @Bean
    RestClient.Builder restClientBuilder() {
        // 외부 API 클라이언트는 서비스별 baseUrl만 얹어서 재사용한다.
        return RestClient.builder();
    }

    @Bean
    ObjectMapper objectMapper() {
        // Java time 등 기본 모듈을 같이 등록해 PortOne 응답 파싱에 바로 사용한다.
        return new ObjectMapper().findAndRegisterModules();
    }
}
