package io.github.dongyuns.jubjub.domain.reward.entity;

import io.github.dongyuns.jubjub.domain.reward.enums.RewardType;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RewardHistory {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_profile_id", nullable = false)
    private MemberProfile memberProfile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RewardType rewardType;

    private int amount; // 증감된 양 (XP 혹은 포인트)

    private String description;

    private LocalDateTime createdAt;

    @Builder
    public RewardHistory(MemberProfile memberProfile, RewardType rewardType, int amount, String description) {
        this.memberProfile = memberProfile;
        this.rewardType = rewardType;
        this.amount = amount;
        this.description = description;
        this.createdAt = LocalDateTime.now();
    }
}