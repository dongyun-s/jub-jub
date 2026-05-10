package io.github.dongyuns.jubjub.domain.ordertracking.repository;

import io.github.dongyuns.jubjub.domain.ordertracking.entity.OrderTrackingNotification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderTrackingNotificationRepository extends JpaRepository<OrderTrackingNotification, Long> {

    List<OrderTrackingNotification> findAllByMemberProfileIdOrderByCreatedAtDesc(Long memberProfileId);

    long countByMemberProfileIdAndReadFalse(Long memberProfileId);

    Optional<OrderTrackingNotification> findTopByOrderIdAndTitleOrderByCreatedAtDesc(Long orderId, String title);

    Optional<OrderTrackingNotification> findByIdAndMemberProfileId(Long id, Long memberProfileId);
}
