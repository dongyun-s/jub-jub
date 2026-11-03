package io.github.dongyuns.jubjub.domain.owner.dashboard.repository;

import io.github.dongyuns.jubjub.domain.core.order.entity.OrderStatus;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTrackingStatus;
import io.github.dongyuns.jubjub.domain.core.review.entity.Review;
import io.github.dongyuns.jubjub.domain.owner.dashboard.dto.BestMenuResponse;
import io.github.dongyuns.jubjub.domain.owner.dashboard.dto.DailySalesResponse;
import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class OwnerDashboardQueryRepository {

    private static final List<OrderStatus> SALES_STATUSES = List.of(OrderStatus.PAID, OrderStatus.COMPLETED);
    private static final List<OrderStatus> COUNTED_ORDER_STATUSES = List.of(
            OrderStatus.PAID,
            OrderStatus.COMPLETED,
            OrderStatus.REFUNDED
    );
    private static final List<OrderTrackingStatus> ACTIVE_TRACKING_STATUSES = List.of(
            OrderTrackingStatus.RECEIVED,
            OrderTrackingStatus.COOKING,
            OrderTrackingStatus.READY_FOR_PICKUP
    );

    private final EntityManager entityManager;

    public long findSalesAmount(Long storeId, LocalDateTime start, LocalDateTime end) {
        Number result = (Number) entityManager.createQuery("""
                        select coalesce(sum(o.finalAmount), 0)
                        from io.github.dongyuns.jubjub.domain.core.order.entity.Order o
                        where o.store.id = :storeId
                          and o.paidAt >= :start
                          and o.paidAt < :end
                          and o.status in :statuses
                        """)
                .setParameter("storeId", storeId)
                .setParameter("start", start)
                .setParameter("end", end)
                .setParameter("statuses", SALES_STATUSES)
                .getSingleResult();
        return result.longValue();
    }

    public long countOrders(Long storeId, LocalDateTime start, LocalDateTime end) {
        Number result = (Number) entityManager.createQuery("""
                        select count(o)
                        from io.github.dongyuns.jubjub.domain.core.order.entity.Order o
                        where o.store.id = :storeId
                          and o.paidAt >= :start
                          and o.paidAt < :end
                          and o.status in :statuses
                        """)
                .setParameter("storeId", storeId)
                .setParameter("start", start)
                .setParameter("end", end)
                .setParameter("statuses", COUNTED_ORDER_STATUSES)
                .getSingleResult();
        return result.longValue();
    }

    public long countActiveOrders(Long storeId) {
        Number result = (Number) entityManager.createQuery("""
                        select count(ot)
                        from OrderTracking ot
                        where ot.status in :trackingStatuses
                          and ot.orderId in (
                              select o.id from io.github.dongyuns.jubjub.domain.core.order.entity.Order o
                              where o.store.id = :storeId and o.status = :orderStatus
                          )
                        """)
                .setParameter("trackingStatuses", ACTIVE_TRACKING_STATUSES)
                .setParameter("storeId", storeId)
                .setParameter("orderStatus", OrderStatus.PAID)
                .getSingleResult();
        return result.longValue();
    }

    public List<DailySalesResponse> findDailySales(
            Long storeId,
            LocalDate startDate,
            LocalDate endDateExclusive
    ) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDateExclusive.atStartOfDay();
        List<Object[]> rows = entityManager.createQuery("""
                        select o.paidAt, o.finalAmount
                        from io.github.dongyuns.jubjub.domain.core.order.entity.Order o
                        where o.store.id = :storeId
                          and o.paidAt >= :start
                          and o.paidAt < :end
                          and o.status in :statuses
                        order by o.paidAt asc
                        """, Object[].class)
                .setParameter("storeId", storeId)
                .setParameter("start", start)
                .setParameter("end", end)
                .setParameter("statuses", SALES_STATUSES)
                .getResultList();

        Map<LocalDate, Long> salesByDate = new LinkedHashMap<>();
        for (LocalDate date = startDate; date.isBefore(endDateExclusive); date = date.plusDays(1)) {
            salesByDate.put(date, 0L);
        }
        for (Object[] row : rows) {
            LocalDate date = ((LocalDateTime) row[0]).toLocalDate();
            salesByDate.computeIfPresent(date, (ignored, amount) -> amount + ((Number) row[1]).longValue());
        }

        return salesByDate.entrySet().stream()
                .map(entry -> new DailySalesResponse(entry.getKey(), entry.getValue()))
                .toList();
    }

    public List<BestMenuResponse> findBestMenus(Long storeId, LocalDateTime start, int limit) {
        List<Object[]> rows = entityManager.createQuery("""
                        select oi.menuId, oi.menuName, sum(oi.quantity), sum(oi.itemTotalAmount)
                        from OrderItem oi
                        where oi.order.store.id = :storeId
                          and oi.order.paidAt >= :start
                          and oi.order.status in :statuses
                        group by oi.menuId, oi.menuName
                        order by sum(oi.quantity) desc, sum(oi.itemTotalAmount) desc
                        """, Object[].class)
                .setParameter("storeId", storeId)
                .setParameter("start", start)
                .setParameter("statuses", SALES_STATUSES)
                .setMaxResults(limit)
                .getResultList();

        return rows.stream()
                .map(row -> new BestMenuResponse(
                        (Long) row[0],
                        (String) row[1],
                        ((Number) row[2]).longValue(),
                        ((Number) row[3]).longValue()
                ))
                .toList();
    }

    public ReviewMetrics findReviewMetrics(Long storeId) {
        Object[] row = entityManager.createQuery("""
                        select avg(r.overallRating), count(r.reviewId)
                        from Review r
                        where r.storeId = :storeId
                        """, Object[].class)
                .setParameter("storeId", storeId)
                .getSingleResult();

        Double averageRating = row[0] != null ? ((Number) row[0]).doubleValue() : 0.0;
        return new ReviewMetrics(averageRating, ((Number) row[1]).longValue());
    }

    public List<Review> findRecentReviews(Long storeId, int limit) {
        return entityManager.createQuery("""
                        select r from Review r
                        where r.storeId = :storeId
                        order by r.createdAt desc, r.reviewId desc
                        """, Review.class)
                .setParameter("storeId", storeId)
                .setMaxResults(limit)
                .getResultList();
    }

    public record ReviewMetrics(Double averageRating, Long reviewCount) {
    }
}
