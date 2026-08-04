package io.github.dongyuns.jubjub.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        // 1. 보안 스키마 정의 (JWT Bearer 토큰 설정)
        // Swagger에서 'Bearer [토큰]' 형식으로 헤더에 넣도록 명시합니다.
        SecurityScheme securityScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .in(SecurityScheme.In.HEADER)
                .name("Authorization");

        // 2. 전역 보안 요구사항 설정
        // 이 설정을 통해 모든 API에 자물쇠 아이콘이 생기고 토큰을 전역으로 적용할 수 있습니다.
        SecurityRequirement securityRequirement = new SecurityRequirement().addList("bearerAuth");

        return new OpenAPI()
                .info(new Info()
                        .title("JubJub API 명세서")
                        .version("v1")
                        .description("줍줍 프로젝트 API 명세서입니다."))
                // 3. 위에서 만든 스키마와 요구사항을 OpenAPI 객체에 조립합니다.
                .components(new Components().addSecuritySchemes("bearerAuth", securityScheme))
                .addSecurityItem(securityRequirement);
    }
}