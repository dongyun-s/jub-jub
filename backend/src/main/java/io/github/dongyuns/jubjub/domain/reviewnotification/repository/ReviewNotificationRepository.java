package io.github.dongyuns.jubjub.domain.reviewnotification.repository;

import io.github.dongyuns.jubjub.domain.reviewnotification.entity.ReviewNotification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewNotificationRepository extends JpaRepository<ReviewNotification, Long> {

    List<ReviewNotification> findAllByMemberProfileIdOrderByCreatedAtDesc(Long memberProfileId);

    long countByMemberProfileIdAndReadFalse(Long memberProfileId);

    Optional<ReviewNotification> findTopByOrderIdOrderByCreatedAtDesc(Long orderId);

    Optional<ReviewNotification> findByIdAndMemberProfileId(Long id, Long memberProfileId);
}
