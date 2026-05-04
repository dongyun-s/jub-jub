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
@Table(name = "고객_보유_쿠폰")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class MemberCoupon {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "보유쿠폰번호")
    private Long id;

    @Column(name = "고객프로필번호", nullable = false)
    private Long memberProfileId;

    @Column(name = "쿠폰정책번호", nullable = false)
    private Long couponPolicyId;

    @Column(name = "사용여부", nullable = false)
    private Boolean isUsed;

    @CreatedDate
    @Column(name = "발급일시", updatable = false)
    private LocalDateTime issuedAt;

    @Column(name = "만료일시")
    private LocalDateTime expiredAt;

    @Column(name = "사용일시")
    private LocalDateTime usedAt;

    @Builder
    public MemberCoupon(Long memberProfileId, Long couponPolicyId, LocalDateTime expiredAt) {
        this.memberProfileId = memberProfileId;
        this.couponPolicyId = couponPolicyId;
        this.isUsed = false;
        this.expiredAt = expiredAt;
    }
}