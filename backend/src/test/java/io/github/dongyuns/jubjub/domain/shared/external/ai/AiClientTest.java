package io.github.dongyuns.jubjub.domain.shared.external.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;

class AiClientTest {

    @Test
    void sendsFastApiContractAndReadsEstimatedMinutes() throws Exception {
        AtomicReference<String> requestBody = new AtomicReference<>();
        AtomicReference<String> requestMethod = new AtomicReference<>();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/predict/pickup-time", exchange -> {
            requestMethod.set(exchange.getRequestMethod());
            requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] response = "{\"estimated_minutes\":26}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            try (var body = exchange.getResponseBody()) {
                body.write(response);
            }
        });
        server.start();
        try {
            AiClient client = new AiClient(RestClient.builder(), "http://127.0.0.1:" + server.getAddress().getPort());
            int minutes = client.predictPickupMinutes(
                    1L, 15, List.of(new AiClient.PickupItem(5L, 2)), 3,
                    OffsetDateTime.parse("2026-09-18T12:00:00+09:00")
            );

            JsonNode request = new ObjectMapper().readTree(requestBody.get());
            assertThat(requestMethod.get()).isEqualTo("POST");
            assertThat(request.get("store_id").asLong()).isEqualTo(1L);
            assertThat(request.get("base_cooking_minutes").asInt()).isEqualTo(15);
            assertThat(request.get("items").get(0).get("menu_id").asLong()).isEqualTo(5L);
            assertThat(request.get("items").get(0).get("quantity").asInt()).isEqualTo(2);
            assertThat(request.get("waiting_order_count").asLong()).isEqualTo(3L);
            assertThat(request.get("requested_at").asText()).isEqualTo("2026-09-18T12:00:00+09:00");
            assertThat(minutes).isEqualTo(26);
        } finally {
            server.stop(0);
        }
    }
}
