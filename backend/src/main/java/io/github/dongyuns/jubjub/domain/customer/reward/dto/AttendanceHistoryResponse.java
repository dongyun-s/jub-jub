package io.github.dongyuns.jubjub.domain.customer.reward.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class AttendanceHistoryResponse {
    private int totalAttendanceCount; // 해당 월의 총 출석 횟수
    private List<LocalDate> attendedDates; // 출석한 날짜 리스트 (예: ["2026-05-01", "2026-05-02"])
}