package io.github.dongyuns.jubjub.domain.auth.repository;

import io.github.dongyuns.jubjub.domain.auth.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    // 이메일로 가입된 계정이 있는지 찾는 기능
    Optional<Account> findByEmail(String email);
}