package io.github.dongyuns.jubjub.domain.couponnotification.repository;

import io.github.dongyuns.jubjub.domain.couponnotification.entity.CouponNotification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponNotificationRepository extends JpaRepository<CouponNotification, Long> {

    List<CouponNotification> findAllByMemberProfileIdOrderByCreatedAtDesc(Long memberProfileId);

    long countByMemberProfileIdAndReadFalse(Long memberProfileId);

    Optional<CouponNotification> findTopByMemberCouponIdOrderByCreatedAtDesc(Long memberCouponId);

    Optional<CouponNotification> findByIdAndMemberProfileId(Long id, Long memberProfileId);
}
