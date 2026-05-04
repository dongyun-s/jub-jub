package io.github.dongyuns.jubjub.domain.reward.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.reward.dto.RewardProfileResponse;
import io.github.dongyuns.jubjub.domain.reward.entity.RewardHistory;
import io.github.dongyuns.jubjub.domain.reward.enums.RewardType;
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
    private final RewardHistoryRepository rewardHistoryRepository; // 내역 저장을 위해 추가

    @Transactional(readOnly = true)
    public RewardProfileResponse getMyRewardProfile(String accountEmail) {
        // 기존에 팀원들이 만들어둔 MemberProfileRepository를 활용하여 회원 정보를 찾습니다.
        MemberProfile profile = memberProfileRepository.findByAccountEmail(accountEmail)
                .orElseThrow(() -> new BusinessException("MEMBER_NOT_FOUND", "회원 정보를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        return RewardProfileResponse.from(profile);
    }

    @Transactional
    public void givePickupReward(String email, int xp, int distance) {
        // 1. 회원 프로필 조회
        MemberProfile profile = memberProfileRepository.findByAccountEmail(email)
                .orElseThrow(() -> new BusinessException("MEMBER_NOT_FOUND", "회원을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        // 2. 엔티티 내부 비즈니스 로직 호출 (경험치/거리 추가 및 등급 갱신)
        profile.addRewardOnPickup(xp, distance);

        // 3. 적립 내역(History) 저장
        // RewardHistory 엔티티에 Builder가 구현되어 있다고 가정합니다.
        RewardHistory history = RewardHistory.builder()
                .memberProfile(profile)
                .rewardType(RewardType.EARN_PICKUP) // 픽업 보상 타입
                .amount(xp)
                .description(String.format("픽업 완료 보상 (이동 거리: %dm)", distance))
                .build();

        rewardHistoryRepository.save(history);
    }
}