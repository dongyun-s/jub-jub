package io.github.dongyuns.jubjub.domain.reward.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.reward.dto.AttendanceHistoryResponse;
import io.github.dongyuns.jubjub.domain.reward.entity.Attendance;
import io.github.dongyuns.jubjub.domain.reward.enums.RewardSource;
import io.github.dongyuns.jubjub.domain.reward.repository.AttendanceRepository;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.user.repository.MemberProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final RewardService rewardService;
    private final CouponIssueService couponIssueService;

    // 유저 정보 조회를 위해 레포지토리 의존성 주입
    private final MemberProfileRepository memberProfileRepository;

    // ==========================================
    // 1. 출석체크 핵심 로직
    // ==========================================
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

        // 4. 7회차 출석 시 랜덤박스 쿠폰 발급 (저장된 직후이므로, 이번 출석을 포함한 총 누적 출석 횟수를 가져옵니다)
        long totalAttendanceCount = attendanceRepository.countByMemberProfile(profile);
        if (totalAttendanceCount > 0 && totalAttendanceCount % 7 == 0) {
            couponIssueService.issueAttendanceRandomBox(profile.getId());
        }
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
}