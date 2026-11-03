package io.github.dongyuns.jubjub.domain.shared.external.tmap;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
@Slf4j
public class TmapAddressGeocoder implements AddressGeocoder {

    private static final Pattern POSTAL_CODE_PREFIX = Pattern.compile("^\\s*\\(?\\d{5}\\)?\\s*");
    private static final Pattern PARENTHESIZED_DETAIL = Pattern.compile("\\s*\\([^)]*\\).*$");

    private final WebClient webClient;
    private final TmapProperties properties;

    @Override
    public GeocodingResult geocode(String address) {
        validateConfiguration();

        List<String> candidates = addressCandidates(address);
        for (String candidate : candidates) {
            Optional<GeocodingResult> result = requestGeocoding(candidate);
            if (result.isPresent()) {
                return result.get();
            }
        }

        throw new BusinessException(
                "STORE_ADDRESS_NOT_FOUND",
                "입력한 매장 주소의 좌표를 찾을 수 없습니다. 도로명 주소를 확인해주세요.",
                HttpStatus.BAD_REQUEST
        );
    }

    private Optional<GeocodingResult> requestGeocoding(String address) {
        URI uri = UriComponentsBuilder.fromUriString(properties.getGeocodingUrl())
                .queryParam("version", 1)
                .queryParam("format", "json")
                .queryParam("coordType", "WGS84GEO")
                .queryParam("addressFlag", "F00")
                .queryParam("fullAddr", address)
                .queryParam("page", 1)
                .queryParam("count", 1)
                .build()
                .encode()
                .toUri();

        try {
            TmapGeocodingResponse response = webClient.get()
                    .uri(uri)
                    .header("appKey", properties.getAppKey())
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, clientResponse -> Mono.error(new BusinessException(
                            "TMAP_GEOCODING_FAILED",
                            "주소 좌표 변환 서비스 호출에 실패했습니다.",
                            HttpStatus.BAD_GATEWAY
                    )))
                    .bodyToMono(TmapGeocodingResponse.class)
                    .block();

            return extractCoordinates(response);
        } catch (BusinessException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            log.error("TMAP 주소 좌표 변환 실패: address={}", address, exception);
            throw new BusinessException(
                    "TMAP_GEOCODING_FAILED",
                    "주소 좌표 변환 서비스 호출에 실패했습니다.",
                    HttpStatus.BAD_GATEWAY
            );
        }
    }

    private Optional<GeocodingResult> extractCoordinates(TmapGeocodingResponse response) {
        if (response == null
                || response.coordinateInfo() == null
                || response.coordinateInfo().coordinate() == null
                || response.coordinateInfo().coordinate().isEmpty()) {
            return Optional.empty();
        }

        TmapGeocodingResponse.Coordinate coordinate = response.coordinateInfo().coordinate().getFirst();
        Optional<GeocodingResult> roadAddressCoordinates = coordinatesOf(coordinate.newLat(), coordinate.newLon());
        return roadAddressCoordinates.isPresent()
                ? roadAddressCoordinates
                : coordinatesOf(coordinate.lat(), coordinate.lon());
    }

    private Optional<GeocodingResult> coordinatesOf(String latitudeValue, String longitudeValue) {
        try {
            double latitude = Double.parseDouble(latitudeValue);
            double longitude = Double.parseDouble(longitudeValue);
            if ((latitude == 0 && longitude == 0)
                    || latitude < -90 || latitude > 90
                    || longitude < -180 || longitude > 180) {
                return Optional.empty();
            }
            return Optional.of(new GeocodingResult(latitude, longitude));
        } catch (NullPointerException | NumberFormatException ignored) {
            return Optional.empty();
        }
    }

    private List<String> addressCandidates(String address) {
        if (address == null || address.isBlank()) {
            throw new BusinessException("STORE_ADDRESS_REQUIRED", "매장 주소는 필수입니다.", HttpStatus.BAD_REQUEST);
        }

        String withoutPostalCode = POSTAL_CODE_PREFIX.matcher(address).replaceFirst("").trim();
        String roadAddress = PARENTHESIZED_DETAIL.matcher(withoutPostalCode).replaceFirst("").trim();

        Set<String> candidates = new LinkedHashSet<>();
        candidates.add(withoutPostalCode);
        candidates.add(roadAddress);
        candidates.removeIf(String::isBlank);
        return List.copyOf(candidates);
    }

    private void validateConfiguration() {
        if (properties.getAppKey() == null || properties.getAppKey().isBlank()
                || properties.getGeocodingUrl() == null || properties.getGeocodingUrl().isBlank()) {
            throw new BusinessException(
                    "TMAP_GEOCODING_NOT_CONFIGURED",
                    "주소 좌표 변환 서비스 설정이 누락되었습니다.",
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
