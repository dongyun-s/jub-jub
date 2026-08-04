package io.github.dongyuns.jubjub.domain.owner.dashboard.service;

import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.owner.dashboard.dto.OwnerDashboardResponse;
import io.github.dongyuns.jubjub.domain.owner.dashboard.dto.RecentReviewResponse;
import io.github.dongyuns.jubjub.domain.owner.dashboard.repository.OwnerDashboardQueryRepository;
import io.github.dongyuns.jubjub.domain.owner.dashboard.repository.OwnerDashboardQueryRepository.ReviewMetrics;
import io.github.dongyuns.jubjub.domain.owner.store.service.OwnerStoreResolver;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OwnerDashboardService {

    private static final int DASHBOARD_DAYS = 7;
    private static final int BEST_MENU_LIMIT = 5;
    private static final int RECENT_REVIEW_LIMIT = 5;

    private final OwnerStoreResolver ownerStoreResolver;
    private final OwnerDashboardQueryRepository ownerDashboardQueryRepository;

    @Transactional(readOnly = true)
    public OwnerDashboardResponse getDashboard(String accountEmail) {
        Store store = ownerStoreResolver.getCurrentOwnerStore(accountEmail);
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(DASHBOARD_DAYS - 1L);
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime tomorrowStart = today.plusDays(1).atStartOfDay();
        ReviewMetrics reviewMetrics = ownerDashboardQueryRepository.findReviewMetrics(store.getId());

        return new OwnerDashboardResponse(
                ownerDashboardQueryRepository.findSalesAmount(store.getId(), todayStart, tomorrowStart),
                ownerDashboardQueryRepository.countOrders(store.getId(), todayStart, tomorrowStart),
                ownerDashboardQueryRepository.countActiveOrders(store.getId()),
                ownerDashboardQueryRepository.findDailySales(store.getId(), weekStart, today.plusDays(1)),
                ownerDashboardQueryRepository.findBestMenus(store.getId(), weekStart.atStartOfDay(), BEST_MENU_LIMIT),
                reviewMetrics.averageRating(),
                reviewMetrics.reviewCount(),
                ownerDashboardQueryRepository.findRecentReviews(store.getId(), RECENT_REVIEW_LIMIT).stream()
                        .map(RecentReviewResponse::from)
                        .toList(),
                store.getStatus()
        );
    }
}
