package io.github.dongyuns.jubjub.domain.reward.repository;

import io.github.dongyuns.jubjub.domain.reward.entity.Attendance;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    // 특정 유저가 오늘 날짜에 이미 출석했는지 여부를 boolean으로 매우 빠르게 확인합니다.
    boolean existsByMemberProfileAndAttendanceDate(MemberProfile memberProfile, LocalDate attendanceDate);
}