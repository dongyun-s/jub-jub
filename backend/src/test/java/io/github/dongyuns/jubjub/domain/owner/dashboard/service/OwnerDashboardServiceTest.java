package io.github.dongyuns.jubjub.domain.owner.dashboard.service;

import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.owner.dashboard.dto.BestMenuResponse;
import io.github.dongyuns.jubjub.domain.owner.dashboard.dto.DailySalesResponse;
import io.github.dongyuns.jubjub.domain.owner.dashboard.dto.OwnerDashboardResponse;
import io.github.dongyuns.jubjub.domain.owner.dashboard.repository.OwnerDashboardQueryRepository;
import io.github.dongyuns.jubjub.domain.owner.dashboard.repository.OwnerDashboardQueryRepository.ReviewMetrics;
import io.github.dongyuns.jubjub.domain.owner.store.service.OwnerStoreResolver;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OwnerDashboardServiceTest {

    @Mock private OwnerStoreResolver ownerStoreResolver;
    @Mock private OwnerDashboardQueryRepository ownerDashboardQueryRepository;

    private OwnerDashboardService ownerDashboardService;

    @BeforeEach
    void setUp() {
        ownerDashboardService = new OwnerDashboardService(ownerStoreResolver, ownerDashboardQueryRepository);
    }

    @Test
    void combinesOwnerStoreMetricsIntoDashboard() {
        Store store = Store.builder().ownerProfileId(10L).name("테스트 매장").status("OPEN").build();
        setField(store, "id", 1L);
        List<DailySalesResponse> weeklySales = List.of(new DailySalesResponse(LocalDate.now(), 120000L));
        List<BestMenuResponse> bestMenus = List.of(new BestMenuResponse(3L, "시그니처 메뉴", 8L, 96000L));

        when(ownerStoreResolver.getCurrentOwnerStore("owner@example.com")).thenReturn(store);
        when(ownerDashboardQueryRepository.findReviewMetrics(1L)).thenReturn(new ReviewMetrics(4.5, 12L));
        when(ownerDashboardQueryRepository.findSalesAmount(eq(1L), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(120000L);
        when(ownerDashboardQueryRepository.countOrders(eq(1L), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(7L);
        when(ownerDashboardQueryRepository.countActiveOrders(1L)).thenReturn(3L);
        when(ownerDashboardQueryRepository.findDailySales(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(weeklySales);
        when(ownerDashboardQueryRepository.findBestMenus(eq(1L), any(LocalDateTime.class), eq(5)))
                .thenReturn(bestMenus);
        when(ownerDashboardQueryRepository.findRecentReviews(1L, 5)).thenReturn(List.of());

        OwnerDashboardResponse response = ownerDashboardService.getDashboard("owner@example.com");

        assertThat(response.todaySales()).isEqualTo(120000L);
        assertThat(response.todayOrderCount()).isEqualTo(7L);
        assertThat(response.activeOrderCount()).isEqualTo(3L);
        assertThat(response.weeklySales()).isEqualTo(weeklySales);
        assertThat(response.bestMenus()).isEqualTo(bestMenus);
        assertThat(response.averageRating()).isEqualTo(4.5);
        assertThat(response.totalReviewCount()).isEqualTo(12L);
        assertThat(response.storeStatus()).isEqualTo("OPEN");
    }

    private void setField(Object target, String fieldName, Object value) {
        try {
            java.lang.reflect.Field field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException exception) {
            throw new IllegalStateException(fieldName + " 필드 설정에 실패했습니다.", exception);
        }
    }
}
