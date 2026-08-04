package io.github.dongyuns.jubjub.domain.core.reward.service;

import io.github.dongyuns.jubjub.domain.core.reward.entity.Attendance;
import io.github.dongyuns.jubjub.domain.core.reward.enums.RewardSource;
import io.github.dongyuns.jubjub.domain.core.reward.repository.AttendanceRepository;
import io.github.dongyuns.jubjub.domain.core.member.entity.MemberProfile;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class) // 🌟 스프링 컨테이너 없이 Mockito 가짜 객체로만 빠르게 테스트합니다.
class AttendanceServiceTest {

    @Mock // 가짜(Mock) 객체를 만듭니다. 실제 DB와 연결되지 않습니다.
    private AttendanceRepository attendanceRepository;

    @Mock // 가짜 리워드 서비스를 만듭니다.
    private RewardService rewardService;

    @InjectMocks // 위에서 만든 가짜 객체들을 주입받아 테스트할 진짜 대상을 만듭니다.
    private AttendanceService attendanceService;

    @Test
    @DisplayName("출석체크 성공: 오늘 처음 출석하면 기록이 저장되고 리워드가 지급된다.")
    void checkIn_Success() {
        // Given (준비)
        MemberProfile profile = MemberProfile.builder().build(); // 빈 프로필 객체 생성
        LocalDate today = LocalDate.now();

        // Repository가 "오늘 출석 안 했어(false)"라고 대답하도록 조작합니다.
        given(attendanceRepository.existsByMemberProfileAndAttendanceDate(profile, today))
                .willReturn(false);

        // When (실행)
        attendanceService.checkIn(profile);

        // Then (검증)
        // 1. Attendance 엔티티가 save 되었는지 확인
        verify(attendanceRepository).save(any(Attendance.class));
        // 2. rewardService의 earnReward가 50 XP와 함께 정확히 호출되었는지 확인
        verify(rewardService).earnReward(eq(profile), eq(RewardSource.ATTENDANCE), eq(50), eq(0), eq(null));
    }

    @Test
    @DisplayName("출석체크 실패: 이미 출석한 상태에서 다시 시도하면 에러가 발생한다.")
    void checkIn_Fail_Duplicate() {
        // Given (준비)
        MemberProfile profile = MemberProfile.builder().build();
        LocalDate today = LocalDate.now();

        // Repository가 "오늘 이미 출석했어(true)"라고 대답하도록 조작합니다.
        given(attendanceRepository.existsByMemberProfileAndAttendanceDate(profile, today))
                .willReturn(true);

        // When & Then (실행과 동시에 검증)
        // checkIn을 실행했을 때 IllegalStateException이 터져야 테스트가 통과합니다.
        assertThrows(IllegalStateException.class, () -> attendanceService.checkIn(profile));
    }
}