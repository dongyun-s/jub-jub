package io.github.dongyuns.jubjub.domain.reward.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "member_coupon")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class MemberCoupon {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long memberProfileId;

    @Column(nullable = false)
    private Long couponPolicyId;

    @Column(nullable = false)
    private Boolean isUsed;

    @CreatedDate
    private LocalDateTime issuedAt;

    private LocalDateTime expiredAt;

    private LocalDateTime usedAt;

    @Builder
    public MemberCoupon(Long memberProfileId, Long couponPolicyId, LocalDateTime expiredAt) {
        this.memberProfileId = memberProfileId;
        this.couponPolicyId = couponPolicyId;
        this.isUsed = false;
        this.expiredAt = expiredAt;
    }
}