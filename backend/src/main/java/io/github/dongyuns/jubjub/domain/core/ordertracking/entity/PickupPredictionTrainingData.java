package io.github.dongyuns.jubjub.domain.core.ordertracking.entity;

import io.github.dongyuns.jubjub.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Duration;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
        name = "pickup_prediction_training_data",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_pickup_training_order",
                columnNames = "order_id"
        )
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PickupPredictionTrainingData extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @Column(nullable = false)
    private int baseCookingMinutes;

    @Column(nullable = false)
    private int totalItemQuantity;

    @Column(nullable = false)
    private int distinctMenuCount;

    @Column(nullable = false)
    private long waitingOrderCount;

    @Column(nullable = false)
    private LocalDateTime cookingStartedAt;

    @Column(nullable = false)
    private int requestHour;

    @Column(nullable = false)
    private int dayOfWeek;

    @Column(nullable = false)
    private int predictedCookingMinutes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PredictionSource predictionSource;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TrainingDataSource dataSource;

    private LocalDateTime actualReadyAt;

    private Double actualCookingMinutes;

    public static PickupPredictionTrainingData real(
            Long orderId,
            Long storeId,
            int baseCookingMinutes,
            int totalItemQuantity,
            int distinctMenuCount,
            long waitingOrderCount,
            LocalDateTime cookingStartedAt,
            int predictedCookingMinutes,
            PredictionSource predictionSource
    ) {
        PickupPredictionTrainingData data = new PickupPredictionTrainingData();
        data.orderId = orderId;
        data.storeId = storeId;
        data.baseCookingMinutes = baseCookingMinutes;
        data.totalItemQuantity = totalItemQuantity;
        data.distinctMenuCount = distinctMenuCount;
        data.waitingOrderCount = waitingOrderCount;
        data.cookingStartedAt = cookingStartedAt;
        data.requestHour = cookingStartedAt.getHour();
        data.dayOfWeek = cookingStartedAt.getDayOfWeek().getValue();
        data.predictedCookingMinutes = predictedCookingMinutes;
        data.predictionSource = predictionSource;
        data.dataSource = TrainingDataSource.REAL;
        return data;
    }

    public void complete(LocalDateTime readyAt) {
        long actualSeconds = Math.max(Duration.between(cookingStartedAt, readyAt).getSeconds(), 0L);
        this.actualReadyAt = readyAt;
        this.actualCookingMinutes = actualSeconds / 60.0;
    }
}
