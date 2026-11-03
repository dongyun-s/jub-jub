package io.github.dongyuns.jubjub.domain.core.notification.entity;

import io.github.dongyuns.jubjub.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "coupon_notification")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CouponNotification extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long memberProfileId;

    @Column(nullable = false)
    private Long memberCouponId;

    @Column(nullable = false)
    private Long couponPolicyId;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Builder
    private CouponNotification(
            Long memberProfileId,
            Long memberCouponId,
            Long couponPolicyId,
            String title,
            String message,
            boolean read
    ) {
        this.memberProfileId = memberProfileId;
        this.memberCouponId = memberCouponId;
        this.couponPolicyId = couponPolicyId;
        this.title = title;
        this.message = message;
        this.read = read;
    }

    public static CouponNotification of(
            Long memberProfileId,
            Long memberCouponId,
            Long couponPolicyId,
            String title,
            String message
    ) {
        return CouponNotification.builder()
                .memberProfileId(memberProfileId)
                .memberCouponId(memberCouponId)
                .couponPolicyId(couponPolicyId)
                .title(title)
                .message(message)
                .build();
    }

    public void markAsRead() {
        this.read = true;
    }
}
