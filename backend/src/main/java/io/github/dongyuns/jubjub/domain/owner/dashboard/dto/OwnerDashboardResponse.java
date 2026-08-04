package io.github.dongyuns.jubjub.domain.owner.dashboard.dto;

import java.util.List;

public record OwnerDashboardResponse(
        Long todaySales,
        Long todayOrderCount,
        Long activeOrderCount,
        List<DailySalesResponse> weeklySales,
        List<BestMenuResponse> bestMenus,
        Double averageRating,
        Long totalReviewCount,
        List<RecentReviewResponse> recentReviews,
        String storeStatus
) {
}
