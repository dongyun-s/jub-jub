package io.github.dongyuns.jubjub.domain.core.reward.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RewardType {
    EARNED("적립"),
    USED("사용"),
    EXPIRED("소멸"); // 기간 만료 등

    private final String description;
}