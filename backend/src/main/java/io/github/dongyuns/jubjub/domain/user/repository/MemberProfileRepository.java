package io.github.dongyuns.jubjub.domain.user.repository;

import io.github.dongyuns.jubjub.domain.auth.entity.Account;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
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

    // 탈퇴(isDeleted = true)한 유저 중, 특정 날짜(deletedAt) 이전에 탈퇴한 유저 목록 조회
    List<MemberProfile> findByIsDeletedTrueAndDeletedAtBefore(LocalDateTime cutoffDate);
}
