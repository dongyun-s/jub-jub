package io.github.dongyuns.jubjub.common.security;

import io.github.dongyuns.jubjub.domain.customer.auth.dto.TokenResponse;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secretKeyPlain;

    @Value("${jwt.access-token-expiration}")
    private long accessTokenValidityInMilliseconds;

    // application.yaml에 설정이 없다면 기본값으로 14일(1209600000ms)을 사용합니다.
    @Value("${jwt.refresh-token-expiration:1209600000}")
    private long refreshTokenValidityInMilliseconds;

    private SecretKey key;

    @PostConstruct
    protected void init() {
        this.key = Keys.hmacShaKeyFor(secretKeyPlain.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 🌟 통합 토큰 생성 (Access + Refresh)
     * 로그인 성공 시 이 메서드 하나로 두 토큰을 모두 생성합니다.
     */
    public TokenResponse createToken(String email, String role) {
        return TokenResponse.builder()
                .accessToken(createAccessToken(email, role))
                .refreshToken(createRefreshToken(email))
                .build();
    }

    /**
     * 1. Access Token 생성
     */
    public String createAccessToken(String email, String role) {
        Claims claims = Jwts.claims()
                .subject(email)
                .add("role", role)
                .build();

        Date now = new Date();
        Date validity = new Date(now.getTime() + accessTokenValidityInMilliseconds);

        return Jwts.builder()
                .claims(claims)
                .setIssuedAt(now)
                .setExpiration(validity)
                .signWith(key)
                .compact();
    }

    /**
     * 2. Refresh Token 생성
     * Refresh Token은 보안을 위해 role 정보를 담지 않는 것이 일반적입니다.
     */
    public String createRefreshToken(String email) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + refreshTokenValidityInMilliseconds);

        return Jwts.builder()
                .subject(email) // 누구의 토큰인지만 저장
                .setIssuedAt(now)
                .setExpiration(validity)
                .signWith(key)
                .compact();
    }

    /**
     * 3. 토큰에서 사용자 이메일 추출
     */
    public String getEmail(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    /**
     * 4. 토큰 유효성 검증
     */
    public boolean validateToken(String token) {
        try {
            Jws<Claims> claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);

            return !claims.getPayload().getExpiration().before(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}