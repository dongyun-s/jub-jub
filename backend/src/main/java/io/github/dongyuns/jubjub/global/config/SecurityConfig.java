package io.github.dongyuns.jubjub.global.config;

import io.github.dongyuns.jubjub.global.config.security.JwtAuthenticationFilter;
import io.github.dongyuns.jubjub.global.config.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 🌟 1. CORS 설정 (아래 만들어둔 메서드 호출)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .formLogin(formLogin -> formLogin.disable())
                .httpBasic(httpBasic -> httpBasic.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        // 🌟 [추가됨: OPTIONS 메서드 모두 허용] 프론트엔드의 CORS Preflight(사전 요청) 에러 완벽 차단!
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // [Swagger 패스]
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs",
                                "/v3/api-docs/**",
                                "/api-docs",
                                "/api-docs/**"
                        ).permitAll()

                        // [인증(로그인/가입) 패스]
                        .requestMatchers(
                                "/api/test",
                                "/api/v1/auth/signup",
                                "/api/v1/auth/login",
                                "/api/v1/auth/verify/**",
                                "/api/v1/auth/reissue",
                                "/api/v1/auth/find-id",
                                "/api/v1/auth/reset-password",
                                "/api/v1/auth/find-password/send",
                                "/payments/webhook"
                        ).permitAll()

                        // 🌟 [추가됨: 매장 조회 패스] 프론트엔드 테스트를 위해 로그인 없이 매장/메뉴 구경은 가능하도록 허용!
                        .requestMatchers("/api/v1/stores/**", "/api/v1/menus/**").permitAll()

                        // [나머지는 토큰 필요]
                        .anyRequest().authenticated()
                )

                .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // 🌟 2. 빠져있던 CORS 허용 규칙 메서드 추가! (이게 있어야 프론트에서 찔렀을 때 에러가 안 납니다)
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.addAllowedOriginPattern("*"); // 모든 주소 허용 (로컬 테스트용)
        configuration.addAllowedMethod("*"); // GET, POST, PUT, DELETE 모두 허용
        configuration.addAllowedHeader("*"); // 모든 헤더 허용
        configuration.setAllowCredentials(true); // 인증 정보(쿠키, 토큰 등) 포함 허용

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
