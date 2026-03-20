package io.github.dongyuns.jubjub.domain.auth.repository;

import io.github.dongyuns.jubjub.domain.auth.entity.VerificationLog;
import org.springframework.data.jpa.repository.JpaRepository;

// JpaRepository<엔티티 클래스, PK 타입>을 상속받으면 기본적인 CRUD(저장, 조회 등) 메서드가 자동 생성됩니다!
public interface VerificationLogRepository extends JpaRepository<VerificationLog, Long> {
}