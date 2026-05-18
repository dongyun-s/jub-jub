package io.github.dongyuns.jubjub.domain.storesort.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.review.repository.ReviewRepository;
import io.github.dongyuns.jubjub.domain.store.entity.Store;
import io.github.dongyuns.jubjub.domain.store.entity.StoreCategory;
import io.github.dongyuns.jubjub.domain.store.repository.StoreRepository;
import io.github.dongyuns.jubjub.domain.storesort.dto.SortedStoreResponse;
import io.github.dongyuns.jubjub.domain.storesort.dto.StoreSortType;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StoreSortService {

    static final double SEARCH_RADIUS_METERS = 3_000d;
    private static final double METERS_PER_LATITUDE_DEGREE = 111_320d;

    private final StoreRepository storeRepository;
    private final ReviewRepository reviewRepository;
    private final StoreDistanceCalculator storeDistanceCalculator;

    public List<SortedStoreResponse> getStoresWithinRadius(
            String sortBy,
            double latitude,
            double longitude,
            Integer categoryId,
            String category
    ) {
        validateCoordinate(latitude, longitude);

        StoreSortType sortType = StoreSortType.from(sortBy);
        StoreCategory resolvedCategory = StoreCategory.resolve(categoryId, category);

        CoordinateRange coordinateRange = CoordinateRange.of(latitude, longitude, SEARCH_RADIUS_METERS);

        List<Store> candidateStores = resolvedCategory == null
                ? storeRepository.findByLatitudeBetweenAndLongitudeBetween(
                        coordinateRange.minLatitude(),
                        coordinateRange.maxLatitude(),
                        coordinateRange.minLongitude(),
                        coordinateRange.maxLongitude()
                )
                : storeRepository.findByCategoryIdAndLatitudeBetweenAndLongitudeBetween(
                        resolvedCategory.getId(),
                        coordinateRange.minLatitude(),
                        coordinateRange.maxLatitude(),
                        coordinateRange.minLongitude(),
                        coordinateRange.maxLongitude()
                );

        Map<Long, RatingSummary> ratingsByStoreId = loadRatings(candidateStores);

        Comparator<StoreCandidate> comparator = switch (sortType) {
            case DISTANCE -> Comparator.comparingDouble(StoreCandidate::distanceMeters)
                    .thenComparing(StoreCandidate::storeId);
            case RATING -> Comparator.comparingDouble(StoreCandidate::averageRating).reversed()
                    .thenComparingDouble(StoreCandidate::distanceMeters)
                    .thenComparing(StoreCandidate::storeId);
        };

        return candidateStores.stream()
                .filter(store -> hasCoordinate(store.getLatitude(), store.getLongitude()))
                .map(store -> toCandidate(store, latitude, longitude, ratingsByStoreId))
                .filter(candidate -> candidate.distanceMeters() <= SEARCH_RADIUS_METERS)
                .sorted(comparator)
                .map(candidate -> SortedStoreResponse.of(
                        candidate.store(),
                        candidate.distanceMeters(),
                        candidate.averageRating(),
                        candidate.reviewCount()
                ))
                .toList();
    }

    private Map<Long, RatingSummary> loadRatings(List<Store> stores) {
        List<Long> storeIds = stores.stream()
                .map(Store::getId)
                .toList();

        if (storeIds.isEmpty()) {
            return Map.of();
        }

        return reviewRepository.findStoreRatingSummaries(storeIds).stream()
                .collect(Collectors.toMap(
                        ReviewRepository.StoreRatingSummary::getStoreId,
                        summary -> new RatingSummary(
                                roundToOneDecimal(summary.getAverageRating()),
                                summary.getReviewCount()
                        )
                ));
    }

    private StoreCandidate toCandidate(
            Store store,
            double latitude,
            double longitude,
            Map<Long, RatingSummary> ratingsByStoreId
    ) {
        double distanceMeters = storeDistanceCalculator.calculateMeters(
                latitude,
                longitude,
                store.getLatitude(),
                store.getLongitude()
        );

        RatingSummary ratingSummary = ratingsByStoreId.getOrDefault(store.getId(), RatingSummary.EMPTY);
        return new StoreCandidate(store, distanceMeters, ratingSummary.averageRating(), ratingSummary.reviewCount());
    }

    private void validateCoordinate(double latitude, double longitude) {
        if (latitude < -90 || latitude > 90) {
            throw new BusinessException("INVALID_LATITUDE", "위도 값이 올바르지 않습니다.", HttpStatus.BAD_REQUEST);
        }
        if (longitude < -180 || longitude > 180) {
            throw new BusinessException("INVALID_LONGITUDE", "경도 값이 올바르지 않습니다.", HttpStatus.BAD_REQUEST);
        }
    }

    private boolean hasCoordinate(Double latitude, Double longitude) {
        return Objects.nonNull(latitude) && Objects.nonNull(longitude);
    }

    private double roundToOneDecimal(Double value) {
        if (value == null) {
            return 0d;
        }
        return Math.round(value * 10) / 10.0;
    }

    private record CoordinateRange(
            double minLatitude,
            double maxLatitude,
            double minLongitude,
            double maxLongitude
    ) {
        static CoordinateRange of(double latitude, double longitude, double radiusMeters) {
            double latitudeDelta = radiusMeters / METERS_PER_LATITUDE_DEGREE;
            double longitudeDelta = radiusMeters / (METERS_PER_LATITUDE_DEGREE * Math.cos(Math.toRadians(latitude)));

            return new CoordinateRange(
                    latitude - latitudeDelta,
                    latitude + latitudeDelta,
                    longitude - longitudeDelta,
                    longitude + longitudeDelta
            );
        }
    }

    private record RatingSummary(double averageRating, long reviewCount) {
        private static final RatingSummary EMPTY = new RatingSummary(0d, 0L);
    }

    private record StoreCandidate(Store store, double distanceMeters, double averageRating, long reviewCount) {
        Long storeId() {
            return store.getId();
        }
    }
}
