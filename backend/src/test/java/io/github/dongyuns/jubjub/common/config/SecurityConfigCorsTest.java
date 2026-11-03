package io.github.dongyuns.jubjub.common.config;

import io.github.dongyuns.jubjub.common.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class SecurityConfigCorsTest {

    @Test
    void usesOnlyConfiguredOriginsWithCredentials() {
        List<String> origins = List.of(
                "http://localhost:5173",
                "https://jubjub-user.web.app"
        );
        SecurityConfig securityConfig = new SecurityConfig(
                mock(JwtTokenProvider.class),
                new CorsProperties(origins)
        );

        CorsConfiguration configuration = securityConfig.corsConfigurationSource()
                .getCorsConfiguration(new MockHttpServletRequest("GET", "/api/v1/stores"));

        assertThat(configuration).isNotNull();
        assertThat(configuration.getAllowedOrigins()).containsExactlyElementsOf(origins);
        assertThat(configuration.getAllowedOriginPatterns()).isNullOrEmpty();
        assertThat(configuration.getAllowedMethods())
                .containsExactly("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");
        assertThat(configuration.getAllowCredentials()).isTrue();
        assertThat(configuration.getMaxAge()).isEqualTo(3600L);
    }
}
