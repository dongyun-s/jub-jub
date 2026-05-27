package io.github.dongyuns.jubjub.domain.user.scheduler;

import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.user.repository.MemberProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserCleanupScheduler {

    private final MemberProfileRepository memberProfileRepository;

    /**
     * 매일 밤 자정(00:00:00)에 실행되는 자동화 스케줄러
     * cron = "초 분 시 일 월 요일"
     */
    @Transactional
    @Scheduled(cron = "0 0 0 * * *")
    public void processAnonymization() {
        log.info("[스케줄러 시작] 탈퇴 후 30일이 경과한 계정의 비식별화(익명화) 작업을 시작합니다.");

        // 1. 기준일 계산: 지금으로부터 정확히 30일 전 시간 구하기
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);

        // 2. 대상자 찾기 (30일 이전에 탈퇴 요청을 했고, '아직 익명화가 안 된' 사람들)
        List<MemberProfile> targetProfiles = memberProfileRepository.findByIsDeletedTrueAndIsAnonymizedFalseAndDeletedAtBefore(cutoffDate);

        if (targetProfiles.isEmpty()) {
            log.info("[스케줄러 종료] 오늘 비식별화 처리할 대상이 없습니다.");
            return; // 대상자가 없으면 여기서 쿨하게 종료!
        }

        // 3. 대상자들을 순회하며 익명화 처리
        for (MemberProfile profile : targetProfiles) {
            // 프로필 익명화 ("탈퇴회원", "00000000000")
            profile.anonymize();

            // 계정(Account) 익명화
            // UUID 8자리를 붙여서 "deleted_a1b2c3d4@jubjub.com" 형태로 고유한 가짜 이메일을 만듭니다.
            // (이메일 컬럼의 Unique(중복불가) 에러를 방지하기 위함입니다!)
            String randomId = UUID.randomUUID().toString().substring(0, 8);
            profile.getAccount().anonymize(randomId);

            log.info("✅ 계정 비식별화 완료 - Profile ID: {}", profile.getId());
        }

        log.info("[스케줄러 종료] 총 {}명의 계정이 비식별화 처리되었습니다.", targetProfiles.size());
    }
}