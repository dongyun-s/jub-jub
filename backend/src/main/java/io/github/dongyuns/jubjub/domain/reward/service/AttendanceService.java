package io.github.dongyuns.jubjub.domain.reward.service;

import io.github.dongyuns.jubjub.domain.reward.entity.Attendance;
import io.github.dongyuns.jubjub.domain.reward.enums.RewardSource;
import io.github.dongyuns.jubjub.domain.reward.repository.AttendanceRepository;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final RewardService rewardService;

    // 출석체크 핵심 로직
    @Transactional
    public void checkIn(MemberProfile profile) {
        LocalDate today = LocalDate.now();

        // 1. 중복 출석 검증 (Repository 활용)
        if (attendanceRepository.existsByMemberProfileAndAttendanceDate(profile, today)) {
            throw new IllegalStateException("오늘은 이미 출석체크를 완료했습니다.");
        }

        // 2. 새로운 출석 기록 생성 및 DB 저장
        Attendance attendance = Attendance.builder()
                .memberProfile(profile)
                .attendanceDate(today)
                .build();
        attendanceRepository.save(attendance);

        // 3. 리워드 지급 (우리가 만든 범용 earnReward 메서드 호출!)
        // 출석 보상: 50 XP (기획에 따라 변경 가능), 도보 거리 0
        int attendanceXp = 50;
        rewardService.earnReward(
                profile,
                RewardSource.ATTENDANCE,
                attendanceXp,
                0,
                null // 주문/결제와 무관하므로 참조 ID는 null
        );
    }
}