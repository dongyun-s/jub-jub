package io.github.dongyuns.jubjub.global.config;

import io.github.dongyuns.jubjub.global.config.security.JwtAuthenticationFilter;
import io.github.dongyuns.jubjub.global.config.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor // 🌟 추가: 롬복을 이용해 JwtTokenProvider를 자동으로 주입받습니다.
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider; // 🌟 추가: 우리가 만든 토큰 기계

    @Bean
    // 비밀번호 암호화를 위한 BCrypt 인코더를 빈으로 등록합니다.
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // 로컬 테스트를 위해 CSRF 비활성화

                .formLogin(formLogin -> formLogin.disable()) // 기본 제공되는 HTML 폼 로그인 화면 끄기
                .httpBasic(httpBasic -> httpBasic.disable()) // HTTP Basic 인증 방식 끄기

                // 🌟 추가: JWT를 사용하므로 스프링 시큐리티의 기본 세션 방식을 꺼버립니다. (Stateless)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        // 1. Swagger UI 및 API 문서 경로 완전 허용 (프리패스)
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs",
                                "/v3/api-docs/**",
                                "/api-docs",
                                "/api-docs/**"
                        ).permitAll()

                        // 2. 기존 테스트 API와 새로 만든 Auth API 허용 (회원가입, 로그인은 토큰 없이 가능해야 함)
                        .requestMatchers(
                                "/api/test",
                                "/api/v1/auth/signup",       // 회원가입 허용
                                "/api/v1/auth/login",        // 로그인 허용
                                "/api/v1/auth/verify/**",
                                "/api/v1/auth/reissue",       // 인증번호 발송/확인
                                "/api/v1/auth/find-id",       //  아이디 찾기 허용!
                                "/api/v1/auth/reset-password", // 비밀번호 재설정 허용!
                                "/api/v1/auth/find-password/send" // 비밀번호 찾기 발송 API 허용!
                        ).permitAll()

                        // 🌟 3. 변경: 그 외 나머지 모든 요청은 "토큰을 가진 인증된 사용자"만 통과!
                        .anyRequest().authenticated()
                )

                // 🌟 추가: 스프링의 기본 폼 로그인 필터가 작동하기 전에 우리가 만든 JWT 필터를 먼저 세웁니다.
                .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}