package io.github.dongyuns.jubjub.domain.core.member.repository;

import io.github.dongyuns.jubjub.domain.core.account.entity.Account;
import io.github.dongyuns.jubjub.domain.core.member.entity.MemberProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface MemberProfileRepository extends JpaRepository<MemberProfile, Long> {
    // Account 엔티티를 이용해 프로필을 찾는 쿼리 메서드
    Optional<MemberProfile> findByAccount(Account account);
    Optional<MemberProfile> findByAccountEmail(String email);
    // 이름과 휴대폰 번호로 프로필 찾기
    Optional<MemberProfile> findByNameAndPhone(String name, String phone);

    @Query("select mp.id from MemberProfile mp where mp.account.email = :email")
    Optional<Long> findIdByAccountEmail(@Param("email") String email);

    @Query("select mp.phone from MemberProfile mp where mp.id = :id")
    Optional<String> findPhoneById(@Param("id") Long id);

    // 탈퇴(isDeleted = true)한 유저 중, 아직 익명화가 안 된(False) 대상자만 정확하게 타겟팅!
    List<MemberProfile> findByIsDeletedTrueAndIsAnonymizedFalseAndDeletedAtBefore(LocalDateTime cutoffDate);
}
