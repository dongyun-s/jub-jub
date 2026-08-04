package io.github.dongyuns.jubjub.domain.core.ordertracking.entity;

import io.github.dongyuns.jubjub.common.entity.BaseTimeEntity;
import io.github.dongyuns.jubjub.domain.core.order.entity.Order;
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

    public void acceptAndStartCooking(LocalDateTime startedAt, int cookingMinutes) {
        requireStatus(OrderTrackingStatus.RECEIVED);
        this.status = OrderTrackingStatus.COOKING;
        this.progressStartedAt = startedAt;
        this.cookingStartedAt = startedAt;
        this.estimatedPickupTime = startedAt.plusMinutes(Math.max(cookingMinutes, 1));
        this.autoCompletedAt = this.estimatedPickupTime.plusMinutes(30);
    }

    public void markReadyForPickup(LocalDateTime readyAt) {
        requireStatus(OrderTrackingStatus.COOKING);
        this.status = OrderTrackingStatus.READY_FOR_PICKUP;
        this.estimatedPickupTime = readyAt;
        this.autoCompletedAt = readyAt.plusMinutes(30);
    }

    public void completePickup() {
        requireStatus(OrderTrackingStatus.READY_FOR_PICKUP);
        this.status = OrderTrackingStatus.PICKED_UP;
    }

    public void reject() {
        requireStatus(OrderTrackingStatus.RECEIVED);
        this.status = OrderTrackingStatus.REJECTED;
    }

    public boolean needsNotification() {
        return status != null && status != lastNotifiedStatus;
    }

    public void markNotificationSent() {
        this.lastNotifiedStatus = status;
    }

    private void requireStatus(OrderTrackingStatus expected) {
        if (status != expected) {
            throw new IllegalStateException(
                    "주문 상태를 " + expected + "에서만 변경할 수 있습니다. 현재 상태: " + status
            );
        }
    }
}
