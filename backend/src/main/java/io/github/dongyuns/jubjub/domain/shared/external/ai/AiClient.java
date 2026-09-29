package io.github.dongyuns.jubjub.domain.shared.external.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class AiClient {

    private final RestClient restClient;

    public AiClient(
            RestClient.Builder restClientBuilder,
            @Value("${ai.service.base-url:http://localhost:8000}") String baseUrl
    ) {
        // AI 서버가 느리거나 꺼져 있어도 주문 처리가 오래 멈추지 않도록 호출 시간을 제한한다.
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(1000);
        requestFactory.setReadTimeout(1500);
        this.restClient = restClientBuilder.clone()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    public int predictPickupMinutes(
            Long storeId,
            int baseCookingMinutes,
            List<PickupItem> items,
            long waitingOrderCount,
            OffsetDateTime requestedAt
    ) {
        // FastAPI는 소요 시간(분)을 반환하고, 픽업 예정 시각은 Spring Boot에서 계산한다.
        PickupTimeResponse response = restClient.post()
                .uri("/predict/pickup-time")
                .body(new PickupTimeRequest(storeId, baseCookingMinutes, items, waitingOrderCount, requestedAt))
                .retrieve()
                .body(PickupTimeResponse.class);
        if (response == null || response.estimatedMinutes() <= 0) {
            throw new IllegalStateException("AI 픽업 시간 응답이 올바르지 않습니다.");
        }
        return response.estimatedMinutes();
    }

    // JsonProperty는 Java 필드명과 FastAPI의 snake_case 요청 필드명을 맞춘다.
    public record PickupItem(
            @JsonProperty("menu_id") Long menuId,
            int quantity
    ) {
    }

    private record PickupTimeRequest(
            @JsonProperty("store_id") Long storeId,
            @JsonProperty("base_cooking_minutes") int baseCookingMinutes,
            List<PickupItem> items,
            @JsonProperty("waiting_order_count") long waitingOrderCount,
            @JsonProperty("requested_at") OffsetDateTime requestedAt
    ) {
    }

    private record PickupTimeResponse(
            @JsonProperty("estimated_minutes") int estimatedMinutes
    ) {
    }
}
