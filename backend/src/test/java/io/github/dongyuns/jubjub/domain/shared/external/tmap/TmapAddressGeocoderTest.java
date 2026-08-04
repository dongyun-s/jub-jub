package io.github.dongyuns.jubjub.domain.shared.external.tmap;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class TmapAddressGeocoderTest {

    @Test
    void usesRoadAddressCoordinatesWhenTheyExist() {
        WebClient webClient = webClientReturning("""
                {
                  "coordinateInfo": {
                    "coordinate": [{
                      "lat": "37.1",
                      "lon": "126.1",
                      "newLat": "37.5347",
                      "newLon": "126.9028"
                    }]
                  }
                }
                """);

        GeocodingResult result = new TmapAddressGeocoder(webClient, properties())
                .geocode("(07216) 서울 영등포구 당산로42길 16");

        assertThat(result.latitude()).isEqualTo(37.5347);
        assertThat(result.longitude()).isEqualTo(126.9028);
    }

    @Test
    void retriesWithRoadAddressWhenDetailedAddressHasNoResult() {
        AtomicInteger requestCount = new AtomicInteger();
        WebClient webClient = WebClient.builder()
                .exchangeFunction(request -> {
                    String body = requestCount.getAndIncrement() == 0
                            ? "{\"coordinateInfo\":{\"coordinate\":[]}}"
                            : "{\"coordinateInfo\":{\"coordinate\":[{\"lat\":\"37.5347\",\"lon\":\"126.9028\"}]}}";
                    return Mono.just(jsonResponse(body));
                })
                .build();

        GeocodingResult result = new TmapAddressGeocoder(webClient, properties())
                .geocode("(07216) 서울 영등포구 당산로42길 16 (당산현대5차아파트) 101");

        assertThat(requestCount).hasValue(2);
        assertThat(result.latitude()).isEqualTo(37.5347);
        assertThat(result.longitude()).isEqualTo(126.9028);
    }

    private WebClient webClientReturning(String body) {
        return WebClient.builder()
                .exchangeFunction(request -> Mono.just(jsonResponse(body)))
                .build();
    }

    private ClientResponse jsonResponse(String body) {
        return ClientResponse.create(HttpStatus.OK)
                .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .body(body)
                .build();
    }

    private TmapProperties properties() {
        TmapProperties properties = new TmapProperties();
        properties.setAppKey("test-app-key");
        properties.setGeocodingUrl("https://apis.openapi.sk.com/tmap/geo/fullAddrGeo");
        return properties;
    }
}
