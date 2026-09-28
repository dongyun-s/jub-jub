package io.github.dongyuns.jubjub.domain.core.ordertracking.repository;

import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTracking;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTrackingStatus;
import io.github.dongyuns.jubjub.domain.core.order.entity.OrderStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderTrackingRepository extends JpaRepository<OrderTracking, Long> {

    Optional<OrderTracking> findByOrderId(Long orderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select ot from OrderTracking ot where ot.orderId = :orderId")
    Optional<OrderTracking> findByOrderIdForUpdate(@Param("orderId") Long orderId);

    List<OrderTracking> findAllByOrderIdIn(List<Long> orderIds);

    List<OrderTracking> findAllByStatusOrderByIdAsc(OrderTrackingStatus status);

    // 내 주문보다 먼저 결제됐고 아직 수락 대기 또는 조리 중인 같은 매장 주문만 센다.
    // 결제 시각이 같으면 주문 ID로 순서를 고정한다.
    @Query("""
            select count(ot) from OrderTracking ot
            where ot.status in :trackingStatuses
              and ot.orderId in (
                  select o.id from Order o
                  where o.store.id = :storeId and o.status = :orderStatus
                    and (o.paidAt < :paidAt or (o.paidAt = :paidAt and o.id < :orderId))
              )
            """)
    long countEarlierActiveOrders(
            @Param("storeId") Long storeId,
            @Param("orderId") Long orderId,
            @Param("paidAt") LocalDateTime paidAt,
            @Param("orderStatus") OrderStatus orderStatus,
            @Param("trackingStatuses") List<OrderTrackingStatus> trackingStatuses
    );

    // 수락 시에는 결제 순서와 관계없이 이미 조리 중인 같은 매장 주문을 반영한다.
    @Query("""
            select count(ot) from OrderTracking ot
            where ot.status = :cookingStatus
              and ot.orderId <> :orderId
              and ot.orderId in (
                  select o.id from Order o
                  where o.store.id = :storeId and o.status = :orderStatus
              )
            """)
    long countCookingOrders(
            @Param("storeId") Long storeId,
            @Param("orderId") Long orderId,
            @Param("orderStatus") OrderStatus orderStatus,
            @Param("cookingStatus") OrderTrackingStatus cookingStatus
    );
}
