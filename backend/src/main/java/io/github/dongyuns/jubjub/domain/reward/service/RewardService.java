package io.github.dongyuns.jubjub.domain.reward.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.reward.dto.RewardProfileResponse;
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

    @Transactional(readOnly = true)
    public RewardProfileResponse getMyRewardProfile(String accountEmail) {
        // 기존에 팀원들이 만들어둔 MemberProfileRepository를 활용하여 회원 정보를 찾습니다.
        MemberProfile profile = memberProfileRepository.findByAccountEmail(accountEmail)
                .orElseThrow(() -> new BusinessException("MEMBER_NOT_FOUND", "회원 정보를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        return RewardProfileResponse.from(profile);
    }
}