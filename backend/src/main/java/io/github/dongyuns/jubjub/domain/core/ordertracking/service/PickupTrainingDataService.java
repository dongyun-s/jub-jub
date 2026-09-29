package io.github.dongyuns.jubjub.domain.core.ordertracking.service;

import io.github.dongyuns.jubjub.domain.core.order.entity.Order;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.PickupPredictionTrainingData;
import io.github.dongyuns.jubjub.domain.core.ordertracking.repository.PickupPredictionTrainingDataRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class PickupTrainingDataService {

    private final PickupPredictionTrainingDataRepository repository;

    public void startCollection(
            Order order,
            LocalDateTime cookingStartedAt,
            PickupTimePredictionService.PredictionResult prediction
    ) {
        repository.save(PickupPredictionTrainingData.real(
                order.getId(),
                order.getStoreId(),
                prediction.baseCookingMinutes(),
                prediction.totalItemQuantity(),
                prediction.distinctMenuCount(),
                prediction.waitingOrderCount(),
                cookingStartedAt,
                prediction.predictedMinutes(),
                prediction.source()
        ));
    }

    public void completeCollection(Long orderId, LocalDateTime readyAt) {
        repository.findByOrderId(orderId).ifPresentOrElse(
                data -> data.complete(readyAt),
                () -> log.info("학습 데이터 수집 이전에 수락된 주문이므로 실제 조리시간 저장을 건너뜁니다: orderId={}", orderId)
        );
    }
}
