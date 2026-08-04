package io.github.dongyuns.jubjub.domain.core.payment.repository;

import io.github.dongyuns.jubjub.domain.core.payment.entity.PaymentTransaction;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByPortoneTransactionId(String portoneTransactionId);

    @Query("""
            select pt
            from PaymentTransaction pt
            join fetch pt.payment p
            join fetch p.order o
            where pt.createdAt >= :startAt
              and pt.createdAt < :endAt
            """)
    List<PaymentTransaction> findAllForSettlementBetween(
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt
    );
}
