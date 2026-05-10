package io.github.dongyuns.jubjub.domain.reward.dto;

import io.github.dongyuns.jubjub.domain.reward.enums.RewardTier;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "리워드 프로필 응답 정보") // 클래스 설명 추가
public class RewardProfileResponse {
    @Schema(description = "사용자 닉네임", example = "항소")
    private String nickname;
    @Schema(description = "현재 등급 (영문)", example = "BRONZE")
    private RewardTier tier;
    @Schema(description = "등급 이름 (한글)", example = "브론즈")
    private String tierName; // 프론트엔드 노출용 (예: "브론즈")
    @Schema(description = "누적 경험치", example = "0")
    private int cumulativeXp;
    @Schema(description = "누적 도보 거리 (m)", example = "0")
    private int totalWalkingDistance;
    @Schema(description = "누적 주문 횟수", example = "0")
    private int orderCount;
    @Schema(description = "다음 승급까지 남은 주문 횟수", example = "5")
    private int nextTierRequiredCount; // 다음 승급까지 남은 횟수 계산용

    public static RewardProfileResponse from(MemberProfile profile) {
        RewardTier currentTier = profile.getTier();

        // 다음 등급 계산 (현재 레전드면 0, 아니면 다음 등급 요구치 - 현재 횟수)
        int nextRequired = 0;
        if (currentTier != RewardTier.LEGEND) {
            RewardTier[] tiers = RewardTier.values();
            RewardTier nextTier = tiers[currentTier.ordinal() + 1];
            nextRequired = nextTier.getRequiredPickupCount() - profile.getOrderCount();
            if (nextRequired < 0) nextRequired = 0;
        }

        return RewardProfileResponse.builder()
                .nickname(profile.getNickname())
                .tier(currentTier)
                .tierName(currentTier.getLabel())
                .cumulativeXp(profile.getCumulativeXp())
                .totalWalkingDistance(profile.getTotalWalkingDistance())
                .orderCount(profile.getOrderCount())
                .nextTierRequiredCount(nextRequired)
                .build();
    }
}