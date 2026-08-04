package io.github.dongyuns.jubjub.domain.core.account.repository;

import io.github.dongyuns.jubjub.domain.core.account.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    // 이메일로 리프레시 토큰 찾기 (재발급 시 검증용)
    Optional<RefreshToken> findByEmail(String email);

    // 로그아웃 시 토큰 삭제용
    void deleteByEmail(String email);
}