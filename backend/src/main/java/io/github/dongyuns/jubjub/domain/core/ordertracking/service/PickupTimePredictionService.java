package io.github.dongyuns.jubjub.domain.core.ordertracking.service;

import io.github.dongyuns.jubjub.domain.core.order.entity.Order;
import io.github.dongyuns.jubjub.domain.core.order.entity.OrderStatus;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTrackingStatus;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.PredictionSource;
import io.github.dongyuns.jubjub.domain.core.ordertracking.repository.OrderTrackingRepository;
import io.github.dongyuns.jubjub.domain.shared.external.ai.AiClient;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;

@Service
@RequiredArgsConstructor
@Slf4j
public class PickupTimePredictionService {

    private static final ZoneId KOREA_ZONE = ZoneId.of("Asia/Seoul");
    private static final List<OrderTrackingStatus> EARLIER_ACTIVE_STATUSES = List.of(
            OrderTrackingStatus.RECEIVED, OrderTrackingStatus.COOKING
    );

    private final OrderTrackingRepository orderTrackingRepository;
    private final AiClient aiClient;

    // 결제 직후에는 결제 시각을 기준으로 첫 픽업 예정 시각을 계산한다.
    public LocalDateTime predictReadyAt(Order order) {
        LocalDateTime baseTime = order.getPaidAt() != null ? order.getPaidAt() : LocalDateTime.now();
        // 결제 직후의 안내 시간은 먼저 들어온 수락 대기·조리 중 주문을 기준으로 한다.
        long waitingOrders = orderTrackingRepository.countEarlierActiveOrders(
                order.getStoreId(), order.getId(), order.getPaidAt(), OrderStatus.PAID,
                EARLIER_ACTIVE_STATUSES
        );
        return requestPrediction(order, baseTime, waitingOrders).estimatedReadyAt();
    }

    public LocalDateTime predictReadyAtOnAcceptance(Order order, LocalDateTime acceptedAt) {
        return predictOnAcceptance(order, acceptedAt).estimatedReadyAt();
    }

    public PredictionResult predictOnAcceptance(Order order, LocalDateTime acceptedAt) {
        // 수락하지 않은 주문은 실제 조리 작업이 아니므로, 이미 조리 중인 주문만 반영한다.
        long cookingOrders = orderTrackingRepository.countCookingOrders(
                order.getStoreId(), order.getId(), OrderStatus.PAID, OrderTrackingStatus.COOKING
        );
        return requestPrediction(order, acceptedAt, cookingOrders);
    }

    private PredictionResult requestPrediction(Order order, LocalDateTime baseTime, long waitingOrders) {
        int fallbackMinutes = Math.max(order.getStore().getCookingTimeMinutes(), 1);
        List<AiClient.PickupItem> items = order.getItems().stream()
                .map(item -> new AiClient.PickupItem(item.getMenuId(), item.getQuantity()))
                .toList();
        int totalItemQuantity = items.stream().mapToInt(AiClient.PickupItem::quantity).sum();

        try {
            int estimatedMinutes = aiClient.predictPickupMinutes(
                    order.getStoreId(),
                    fallbackMinutes,
                    items,
                    waitingOrders,
                    // FastAPI가 피크 시간을 판별할 수 있도록 한국 시간대 정보를 함께 보낸다.
                    baseTime.atZone(KOREA_ZONE).toOffsetDateTime()
            );
            return new PredictionResult(
                    baseTime.plusMinutes(estimatedMinutes), fallbackMinutes, totalItemQuantity,
                    items.size(), waitingOrders, estimatedMinutes, PredictionSource.FASTAPI
            );
        } catch (RestClientException | IllegalStateException exception) {
            // AI 서버 장애 시에도 주문 추적과 사장님 수락은 기본 조리시간으로 계속 진행한다.
            log.warn("AI 픽업 시간 예측 실패, 기본 조리시간 사용: orderId={}", order.getId(), exception);
            return new PredictionResult(
                    baseTime.plusMinutes(fallbackMinutes), fallbackMinutes, totalItemQuantity,
                    items.size(), waitingOrders, fallbackMinutes, PredictionSource.FALLBACK
            );
        }
    }

    public record PredictionResult(
            LocalDateTime estimatedReadyAt,
            int baseCookingMinutes,
            int totalItemQuantity,
            int distinctMenuCount,
            long waitingOrderCount,
            int predictedMinutes,
            PredictionSource source
    ) {
    }
}
