package io.github.dongyuns.jubjub.domain.core.reward.entity;

import io.github.dongyuns.jubjub.domain.core.reward.enums.RewardType; // 획득, 사용 등
import io.github.dongyuns.jubjub.domain.core.reward.enums.RewardSource; // PICKUP, ATTENDANCE 등
import io.github.dongyuns.jubjub.domain.core.member.entity.MemberProfile;
import io.github.dongyuns.jubjub.common.entity.BaseTimeEntity; // 공통 시간 엔티티 가정
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class) // 시간 자동 기록 보장
public class RewardHistory extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_profile_id", nullable = false)
    private MemberProfile memberProfile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private RewardType rewardType; // 예: EARNED(획득), USED(사용)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private RewardSource rewardSource; // 🌟 추가: PICKUP, ATTENDANCE 등 사유 명시

    private int earnedXp;      // 🌟 세분화: 이번에 획득한 XP
    private int earnedDistance; // 🌟 세분화: 이번에 획득한 거리

    private String description;

    // 🌟 추가: 관련된 주문 ID나 이벤트 ID를 기록 (추적용)
    private Long referenceId;

    @Builder
    public RewardHistory(MemberProfile memberProfile, RewardType rewardType, RewardSource rewardSource,
                         int earnedXp, int earnedDistance, String description, Long referenceId) {
        this.memberProfile = memberProfile;
        this.rewardType = rewardType;
        this.rewardSource = rewardSource;
        this.earnedXp = earnedXp;
        this.earnedDistance = earnedDistance;
        this.description = description;
        this.referenceId = referenceId;
    }
}