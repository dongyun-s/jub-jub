package io.github.dongyuns.jubjub.domain.storesort.service;

import io.github.dongyuns.jubjub.domain.review.repository.ReviewRepository;
import io.github.dongyuns.jubjub.domain.store.entity.Store;
import io.github.dongyuns.jubjub.domain.store.repository.StoreRepository;
import io.github.dongyuns.jubjub.domain.storesort.dto.SortedStoreResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StoreSortServiceTest {

    @Mock
    private StoreRepository storeRepository;

    @Mock
    private ReviewRepository reviewRepository;

    private StoreSortService storeSortService;

    @BeforeEach
    void setUp() {
        storeSortService = new StoreSortService(
                storeRepository,
                reviewRepository,
                new StoreDistanceCalculator()
        );
    }

    @Test
    void sortsByDistanceWithinTwoKilometers() {
        Store nearestStore = createStore(1L, "가까운 매장", 37.5005, 127.0305);
        Store fartherStore = createStore(2L, "조금 먼 매장", 37.5080, 127.0350);
        Store outOfRangeStore = createStore(3L, "반경 밖 매장", 37.5300, 127.0600);

        when(storeRepository.findByLatitudeBetweenAndLongitudeBetween(any(), any(), any(), any()))
                .thenReturn(List.of(fartherStore, outOfRangeStore, nearestStore));
        when(reviewRepository.findStoreRatingSummaries(List.of(2L, 3L, 1L)))
                .thenReturn(List.of());

        List<SortedStoreResponse> result = storeSortService.getStoresWithinRadius(
                "DISTANCE",
                37.5000,
                127.0300,
                null,
                null
        );

        assertThat(result).hasSize(2);
        assertThat(result)
                .extracting(SortedStoreResponse::storeId)
                .containsExactly(1L, 2L);
        assertThat(result.get(0).distanceMeters()).isLessThan(result.get(1).distanceMeters());
        verify(storeRepository).findByLatitudeBetweenAndLongitudeBetween(any(), any(), any(), any());
        verify(storeRepository, never()).findByCategoryIdAndLatitudeBetweenAndLongitudeBetween(any(), any(), any(), any(), any());
    }

    @Test
    void sortsByRatingWithinTwoKilometersAndUsesDistanceAsTieBreaker() {
        Store higherRatedStore = createStore(1L, "평점 높은 매장", 37.5007, 127.0302);
        Store sameRatingButCloserStore = createStore(2L, "동점이지만 더 가까운 매장", 37.5003, 127.0301);
        Store lowerRatedStore = createStore(3L, "평점 낮은 매장", 37.5010, 127.0303);

        when(storeRepository.findByLatitudeBetweenAndLongitudeBetween(any(), any(), any(), any()))
                .thenReturn(List.of(lowerRatedStore, sameRatingButCloserStore, higherRatedStore));
        when(reviewRepository.findStoreRatingSummaries(List.of(3L, 2L, 1L)))
                .thenReturn(List.of(
                        summary(1L, 4.8, 12L),
                        summary(2L, 4.8, 7L),
                        summary(3L, 4.1, 20L)
                ));

        List<SortedStoreResponse> result = storeSortService.getStoresWithinRadius(
                "RATING",
                37.5000,
                127.0300,
                null,
                null
        );

        assertThat(result).hasSize(3);
        assertThat(result)
                .extracting(SortedStoreResponse::storeId)
                .containsExactly(2L, 1L, 3L);
        assertThat(result.get(0).averageRating()).isEqualTo(4.8);
        assertThat(result.get(0).reviewCount()).isEqualTo(7L);
    }

    @Test
    void usesCategoryFilteredRepositoryWhenCategoryIdProvided() {
        Store cafeStore = createStore(10L, "카페", 37.5004, 127.0304);

        when(storeRepository.findByCategoryIdAndLatitudeBetweenAndLongitudeBetween(eq(6), any(), any(), any(), any()))
                .thenReturn(List.of(cafeStore));
        when(reviewRepository.findStoreRatingSummaries(List.of(10L)))
                .thenReturn(List.of());

        List<SortedStoreResponse> result = storeSortService.getStoresWithinRadius(
                "DISTANCE",
                37.5000,
                127.0300,
                6,
                null
        );

        assertThat(result).hasSize(1);
        verify(storeRepository).findByCategoryIdAndLatitudeBetweenAndLongitudeBetween(eq(6), any(), any(), any(), any());
    }

    private Store createStore(Long id, String name, double latitude, double longitude) {
        Store store = Store.builder()
                .ownerProfileId(1L)
                .categoryId(6)
                .name(name)
                .address("서울시 강남구")
                .phoneNumber("02-0000-0000")
                .latitude(latitude)
                .longitude(longitude)
                .cookingTimeMinutes(15)
                .status("OPEN")
                .originInfo("원산지")
                .minOrderAmount(10000)
                .build();

        try {
            java.lang.reflect.Field idField = Store.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(store, id);
        } catch (ReflectiveOperationException exception) {
            throw new IllegalStateException("테스트용 Store ID 세팅에 실패했습니다.", exception);
        }

        return store;
    }

    private ReviewRepository.StoreRatingSummary summary(Long storeId, Double averageRating, Long reviewCount) {
        return new ReviewRepository.StoreRatingSummary() {
            @Override
            public Long getStoreId() {
                return storeId;
            }

            @Override
            public Double getAverageRating() {
                return averageRating;
            }

            @Override
            public Long getReviewCount() {
                return reviewCount;
            }
        };
    }
}
