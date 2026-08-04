package io.github.dongyuns.jubjub.domain.core.ordertracking.repository;

import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTracking;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTrackingStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderTrackingRepository extends JpaRepository<OrderTracking, Long> {

    Optional<OrderTracking> findByOrderId(Long orderId);

    List<OrderTracking> findAllByStatusOrderByIdAsc(OrderTrackingStatus status);
}
