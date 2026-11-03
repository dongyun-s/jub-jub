package io.github.dongyuns.jubjub.domain.core.ordertracking.repository;

import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.PickupPredictionTrainingData;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PickupPredictionTrainingDataRepository
        extends JpaRepository<PickupPredictionTrainingData, Long> {

    Optional<PickupPredictionTrainingData> findByOrderId(Long orderId);
}
