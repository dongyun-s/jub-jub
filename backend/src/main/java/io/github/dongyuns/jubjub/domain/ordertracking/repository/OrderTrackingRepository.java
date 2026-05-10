package io.github.dongyuns.jubjub.domain.ordertracking.repository;

import io.github.dongyuns.jubjub.domain.ordertracking.entity.OrderTracking;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderTrackingRepository extends JpaRepository<OrderTracking, Long> {

    Optional<OrderTracking> findByOrderId(Long orderId);
}
