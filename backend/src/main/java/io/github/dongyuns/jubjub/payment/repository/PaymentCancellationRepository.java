package io.github.dongyuns.jubjub.payment.repository;

import io.github.dongyuns.jubjub.payment.domain.PaymentCancellation;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentCancellationRepository extends JpaRepository<PaymentCancellation, Long> {

    Optional<PaymentCancellation> findTopByPaymentIdOrderByCreatedAtDesc(Long paymentId);

    @Query("""
            select pc
            from PaymentCancellation pc
            join fetch pc.payment p
            join fetch p.order o
            where pc.createdAt >= :startAt
              and pc.createdAt < :endAt
            """)
    List<PaymentCancellation> findAllForSettlementBetween(
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt
    );
}
