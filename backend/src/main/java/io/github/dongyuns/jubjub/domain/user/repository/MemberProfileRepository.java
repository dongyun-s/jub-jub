package io.github.dongyuns.jubjub.domain.user.repository;

import io.github.dongyuns.jubjub.domain.auth.entity.Account;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MemberProfileRepository extends JpaRepository<MemberProfile, Long> {
    // Account 엔티티를 이용해 프로필을 찾는 쿼리 메서드
    Optional<MemberProfile> findByAccount(Account account);
    Optional<MemberProfile> findByAccountEmail(String email);
    // 🌟 이름과 휴대폰 번호로 프로필 찾기
    Optional<MemberProfile> findByNameAndPhone(String name, String phone);
}
