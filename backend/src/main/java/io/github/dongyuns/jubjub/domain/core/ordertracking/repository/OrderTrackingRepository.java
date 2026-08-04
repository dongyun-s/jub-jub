package io.github.dongyuns.jubjub.domain.core.ordertracking.repository;

import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTracking;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTrackingStatus;
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
}
