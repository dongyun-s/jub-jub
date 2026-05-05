package io.github.dongyuns.jubjub.domain.reward.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.reward.dto.RewardProfileResponse;
import io.github.dongyuns.jubjub.domain.reward.entity.RewardHistory;
import io.github.dongyuns.jubjub.domain.reward.enums.RewardSource;
import io.github.dongyuns.jubjub.domain.reward.enums.RewardType; // 기존 로직 존중
import io.github.dongyuns.jubjub.domain.reward.repository.RewardHistoryRepository;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.user.repository.MemberProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RewardService {

    private final MemberProfileRepository memberProfileRepository;
    private final RewardHistoryRepository rewardHistoryRepository;

    // ==========================================
    // 1. [조회]
    // ==========================================
    @Transactional(readOnly = true)
    public RewardProfileResponse getMyRewardProfile(String accountEmail) {
        MemberProfile profile = memberProfileRepository.findByAccountEmail(accountEmail)
                .orElseThrow(() -> new BusinessException("MEMBER_NOT_FOUND", "회원 정보를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        return RewardProfileResponse.from(profile);
    }

    // ==========================================
    // 2. [범용 적립] 모든 보상(픽업, 출석 등)을 처리하는 핵심 로직
    // ==========================================
    @Transactional
    public void earnReward(MemberProfile profile, RewardSource source, int xp, int distance, Long referenceId) {

        // 1) 프로필 수치 업데이트 (픽업일 경우에만 횟수 증가 및 승급 심사)
        boolean isPickup = (source == RewardSource.EARN_PICKUP);
        profile.addReward(xp, distance, isPickup);

        // 2) 최신화된 RewardHistory 엔티티 구조에 맞춰 적립 내역 저장
        RewardHistory history = RewardHistory.builder()
                .memberProfile(profile)
                .rewardType(RewardType.EARNED) // 적립 고정
                .rewardSource(source)
                .earnedXp(xp)
                .earnedDistance(distance)
                .referenceId(referenceId)
                // description은 엔티티 내부에서 source.getDescription()으로 자동 처리됨
                .build();

        rewardHistoryRepository.save(history);
    }

    // ==========================================
    // 3. [픽업 전용 적립]
    // ==========================================
    @Transactional
    public void givePickupReward(String email, int xp, int distance, Long orderId) {
        // 1) 회원 프로필 조회
        MemberProfile profile = memberProfileRepository.findByAccountEmail(email)
                .orElseThrow(() -> new BusinessException("MEMBER_NOT_FOUND", "회원을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        // 2) 범용 메서드를 호출하여 로직 중복 제거 및 깔끔하게 처리!
        earnReward(profile, RewardSource.EARN_PICKUP, xp, distance, orderId);
    }
}