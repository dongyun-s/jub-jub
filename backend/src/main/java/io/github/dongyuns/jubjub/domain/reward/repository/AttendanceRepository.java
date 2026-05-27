package io.github.dongyuns.jubjub.domain.reward.repository;

import io.github.dongyuns.jubjub.domain.reward.entity.Attendance;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    // 특정 유저가 오늘 날짜에 이미 출석했는지 여부를 boolean으로 매우 빠르게 확인
    boolean existsByMemberProfileAndAttendanceDate(MemberProfile memberProfile, LocalDate attendanceDate);

    // 오늘 자격 검증 및 오픈 완료 처리를 위해 오늘 출석 엔티티를 직접 조회
    Optional<Attendance> findByMemberProfileAndAttendanceDate(MemberProfile memberProfile, LocalDate attendanceDate);

    // 오늘 포함 최근 일주일 범위 내에서 이 유저의 출석 데이터 개수가 몇 개인지 카운트
    long countByMemberProfileAndAttendanceDateBetween(MemberProfile memberProfile, LocalDate startDate, LocalDate endDate);

    // 특정 유저의 특정 기간 출석 내역을 오름차순으로 정렬하여 싹 다 가져옵니다.
    List<Attendance> findAllByMemberProfileIdAndAttendanceDateBetweenOrderByAttendanceDateAsc(
            Long memberProfileId,
            LocalDate startDate,
            LocalDate endDate
    );

    // 탈퇴 시 회원의 출석 내역 싹 지우기
    void deleteAllByMemberProfile(MemberProfile memberProfile);
}