package io.github.dongyuns.jubjub.domain.ordertracking.entity;

import io.github.dongyuns.jubjub.payment.domain.BaseTimeEntity;
import io.github.dongyuns.jubjub.payment.domain.Order;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "order_tracking")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderTracking extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long orderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrderTrackingStatus status;

    @Column(nullable = false)
    private LocalDateTime progressStartedAt;

    @Column(nullable = false)
    private LocalDateTime cookingStartedAt;

    @Column(nullable = false)
    private LocalDateTime estimatedPickupTime;

    @Column(nullable = false)
    private LocalDateTime autoCompletedAt;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private OrderTrackingStatus lastNotifiedStatus;

    @Builder
    private OrderTracking(
            Long orderId,
            OrderTrackingStatus status,
            LocalDateTime progressStartedAt,
            LocalDateTime cookingStartedAt,
            LocalDateTime estimatedPickupTime,
            LocalDateTime autoCompletedAt,
            OrderTrackingStatus lastNotifiedStatus
    ) {
        this.orderId = orderId;
        this.status = status;
        this.progressStartedAt = progressStartedAt;
        this.cookingStartedAt = cookingStartedAt;
        this.estimatedPickupTime = estimatedPickupTime;
        this.autoCompletedAt = autoCompletedAt;
        this.lastNotifiedStatus = lastNotifiedStatus;
    }

    public static OrderTracking initialize(Order order) {
        LocalDateTime baseTime = order.getPaidAt() != null ? order.getPaidAt() : LocalDateTime.now();
        int cookingMinutes = Math.max(order.getStore().getCookingTimeMinutes(), 1);
        LocalDateTime pickupTime = baseTime.plusMinutes(cookingMinutes);

        return OrderTracking.builder()
                .orderId(order.getId())
                .status(OrderTrackingStatus.RECEIVED)
                .progressStartedAt(baseTime)
                .cookingStartedAt(baseTime.plusMinutes(1))
                .estimatedPickupTime(pickupTime)
                .autoCompletedAt(pickupTime.plusMinutes(30))
                .build();
    }

    public boolean sync(LocalDateTime now) {
        OrderTrackingStatus resolved = resolveStatus(now);
        if (resolved == status) {
            return false;
        }
        this.status = resolved;
        return true;
    }

    public boolean needsNotification() {
        return status != null && status != lastNotifiedStatus;
    }

    public void markNotificationSent() {
        this.lastNotifiedStatus = status;
    }

    private OrderTrackingStatus resolveStatus(LocalDateTime now) {
        if (!now.isBefore(autoCompletedAt)) {
            return OrderTrackingStatus.PICKED_UP;
        }
        if (!now.isBefore(estimatedPickupTime)) {
            return OrderTrackingStatus.READY_FOR_PICKUP;
        }
        if (!now.isBefore(cookingStartedAt)) {
            return OrderTrackingStatus.COOKING;
        }
        return OrderTrackingStatus.RECEIVED;
    }
}
