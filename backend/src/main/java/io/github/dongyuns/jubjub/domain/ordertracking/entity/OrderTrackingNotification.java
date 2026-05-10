package io.github.dongyuns.jubjub.domain.ordertracking.entity;

import io.github.dongyuns.jubjub.payment.domain.BaseTimeEntity;
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
@Table(name = "order_tracking_notification")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderTrackingNotification extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long memberProfileId;

    @Column(nullable = false)
    private Long orderId;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Builder
    private OrderTrackingNotification(
            Long memberProfileId,
            Long orderId,
            String title,
            String message,
            boolean read
    ) {
        this.memberProfileId = memberProfileId;
        this.orderId = orderId;
        this.title = title;
        this.message = message;
        this.read = read;
    }

    public static OrderTrackingNotification of(Long memberProfileId, Long orderId, String title, String message) {
        return OrderTrackingNotification.builder()
                .memberProfileId(memberProfileId)
                .orderId(orderId)
                .title(title)
                .message(message)
                .build();
    }

    public void markAsRead() {
        this.read = true;
    }
}
