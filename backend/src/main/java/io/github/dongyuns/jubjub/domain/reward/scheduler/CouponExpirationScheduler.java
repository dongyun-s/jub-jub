package io.github.dongyuns.jubjub.domain.reward.scheduler;

import io.github.dongyuns.jubjub.domain.reward.repository.MemberCouponRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class CouponExpirationScheduler {

    private final MemberCouponRepository memberCouponRepository;

    // 매일 새벽 00시 05분에 실행되어 만료된 쿠폰들을 정리합니다. 크론 표현식: "초 분 시 일 월 요일"
    @Transactional
    @Scheduled(cron = "0 5 0 * * *")
    public void processExpiredCoupons() {
        log.info("[스케줄러] 만료 쿠폰 정리 작업을 시작합니다. 기준 시간: {}", LocalDateTime.now());

        try {
            int updatedCount = memberCouponRepository.expireExpiredCoupons(LocalDateTime.now());
            log.info("[스케줄러] 만료 쿠폰 정리 완료. 총 {}개의 쿠폰이 만료 처리되었습니다.", updatedCount);
        } catch (Exception e) {
            log.error("[스케줄러] 만료 쿠폰 정리 중 에러 발생: ", e);
        }
    }
}