package io.github.dongyuns.jubjub.domain.core.reward.event;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
/**
 * 픽업 적립이 완료된 뒤, 쿠폰 발급을 위해 발행하는 이벤트
 */
@Getter
@RequiredArgsConstructor
public class PickupCompletedEvent {
    private final Long memberProfileId;
    private final Long orderId;
    private final boolean tierUpgraded;
    private final int distanceCouponCount;
    private final boolean useMultiUseContainer;
}
