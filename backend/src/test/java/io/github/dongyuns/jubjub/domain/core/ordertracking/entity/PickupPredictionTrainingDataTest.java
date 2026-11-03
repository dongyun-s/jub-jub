package io.github.dongyuns.jubjub.domain.core.ordertracking.entity;

import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PickupPredictionTrainingDataTest {

    @Test
    void storesPredictionFeaturesAndActualCookingMinutes() {
        LocalDateTime startedAt = LocalDateTime.of(2026, 9, 28, 18, 30);
        PickupPredictionTrainingData data = PickupPredictionTrainingData.real(
                100L, 1L, 15, 3, 2, 1L, startedAt, 21, PredictionSource.FASTAPI
        );

        data.complete(startedAt.plusMinutes(18).plusSeconds(30));

        assertThat(data.getRequestHour()).isEqualTo(18);
        assertThat(data.getDayOfWeek()).isEqualTo(1);
        assertThat(data.getDataSource()).isEqualTo(TrainingDataSource.REAL);
        assertThat(data.getActualCookingMinutes()).isEqualTo(18.5);
    }
}
