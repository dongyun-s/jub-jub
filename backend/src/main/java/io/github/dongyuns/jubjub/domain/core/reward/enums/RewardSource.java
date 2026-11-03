package io.github.dongyuns.jubjub.domain.core.reward.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RewardSource {
    EARN_PICKUP("픽업 보상"),
    EARN_ECO("환경 보상"),
    USE_COUPON("쿠폰 사용"),
    ATTENDANCE("출석 보상");

    private final String description;
}