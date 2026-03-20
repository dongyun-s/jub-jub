package io.github.dongyuns.jubjub.domain.auth.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email; // 누구의 토큰인지 확인

    @Column(nullable = false)
    private String token; // 실제 리프레시 토큰 값

    @Builder
    public RefreshToken(String email, String token) {
        this.email = email;
        this.token = token;
    }

    // 토큰 갱신을 위한 메서드
    public void updateToken(String newToken) {
        this.token = newToken;
    }
}