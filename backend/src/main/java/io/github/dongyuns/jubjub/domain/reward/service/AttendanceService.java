package io.github.dongyuns.jubjub.domain.reward.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.reward.dto.AttendanceHistoryResponse;
import io.github.dongyuns.jubjub.domain.reward.entity.Attendance;
import io.github.dongyuns.jubjub.domain.reward.enums.RewardSource;
import io.github.dongyuns.jubjub.domain.reward.repository.AttendanceRepository;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.user.repository.MemberProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final RewardService rewardService;
    private final MemberProfileRepository memberProfileRepository;

    // ==========================================
    // 1. 출석체크 핵심 로직
    // ==========================================
    @Transactional
    public boolean checkIn(MemberProfile profile) {
        LocalDate today = LocalDate.now();

        // 1. 중복 출석 검증
        if (attendanceRepository.existsByMemberProfileAndAttendanceDate(profile, today)) {
            throw new IllegalStateException("오늘은 이미 출석체크를 완료했습니다.");
        }

        // 2. 새로운 출석 기록 생성 및 DB 저장
        Attendance attendance = Attendance.builder()
                .memberProfile(profile)
                .attendanceDate(today)
                .build();
        attendanceRepository.save(attendance);

        // 3. 리워드 지급 (출석 보상: 50 XP, 도보 거리 0)
        int attendanceXp = 50;
        rewardService.earnReward(
                profile,
                RewardSource.ATTENDANCE,
                attendanceXp,
                0,
                null // 주문/결제와 무관하므로 참조 ID는 null
        );

        // 4. 일주일(7일) 연속 출석체크 달성 여부 검증
        LocalDate startDate = today.minusDays(6);
        long consecutiveCount = attendanceRepository
                .countByMemberProfileAndAttendanceDateBetween(profile, startDate, today);

        // 최근 7일 동안 매일 출석했다면 true 반환, 아니면 false 반환
        if (consecutiveCount == 7) {
            log.info("🎉 일주일 연속 개근 달성! 프론트엔드에 랜덤박스 오픈 권한을 부여합니다. 유저 ID: {}", profile.getId());
            return true;
        }

        return false;
    }

    // ==========================================
    // 2. 달력용 출석 내역 데이터 조회
    // ==========================================
    @Transactional(readOnly = true)
    public AttendanceHistoryResponse getMyAttendanceHistory(String accountEmail, int year, int month) {
        // 1. 유저 조회
        MemberProfile profile = memberProfileRepository.findByAccountEmail(accountEmail)
                .orElseThrow(() -> new BusinessException("MEMBER_NOT_FOUND", "회원 정보를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        // 2. 조회할 해당 월의 시작일(1일)과 종료일(말일) 계산
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        // 3. DB에서 기간 내 출석 내역 싹 다 가져오기
        List<Attendance> attendances = attendanceRepository
                .findAllByMemberProfileIdAndAttendanceDateBetweenOrderByAttendanceDateAsc(profile.getId(), startDate, endDate);

        // 4. 엔티티 리스트에서 '날짜(LocalDate)'만 쏙쏙 뽑아내기
        List<LocalDate> attendedDates = attendances.stream()
                .map(Attendance::getAttendanceDate)
                .toList();

        // 5. 예쁜 상자(DTO)에 담아서 반환
        return AttendanceHistoryResponse.builder()
                .totalAttendanceCount(attendedDates.size())
                .attendedDates(attendedDates)
                .build();
    }

    // ==========================================
    // 3. 랜덤박스 오픈 자격 검증 (어뷰징 방지용)
    // ==========================================
    @Transactional(readOnly = true)
    public void validateRandomBoxEligibility(MemberProfile profile) {
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(6);

        long consecutiveCount = attendanceRepository
                .countByMemberProfileAndAttendanceDateBetween(profile, startDate, today);

        // 1차 검증: 7일 연속 출석이 아니라면 예외 발생
        if (consecutiveCount < 7) {
            throw new IllegalStateException("랜덤박스를 오픈할 자격(일주일 연속 출석)이 없습니다.");
        }

        // 🚨 2차 검증 (추가됨): 오늘 이미 상자를 열었는지 확인
        Attendance todayAttendance = attendanceRepository.findByMemberProfileAndAttendanceDate(profile, today)
                .orElseThrow(() -> new IllegalStateException("오늘 출석 기록이 없습니다."));

        if (todayAttendance.isRandomBoxOpened()) {
            throw new IllegalStateException("오늘은 이미 랜덤박스를 확인했습니다. 내일 다시 도전해 주세요!");
        }
    }

    // ==========================================
    // 4. 랜덤박스 오픈 상태로 변경 (어뷰징 방지용)
    // ==========================================
    @Transactional
    public void markRandomBoxAsOpened(MemberProfile profile) {
        LocalDate today = LocalDate.now();

        Attendance todayAttendance = attendanceRepository.findByMemberProfileAndAttendanceDate(profile, today)
                .orElseThrow(() -> new IllegalStateException("오늘 출석 기록이 없습니다."));

        // 상태를 true로 변경 (JPA 더티체킹으로 DB에 자동 업데이트 반영됨)
        todayAttendance.markAsOpened();
    }
}