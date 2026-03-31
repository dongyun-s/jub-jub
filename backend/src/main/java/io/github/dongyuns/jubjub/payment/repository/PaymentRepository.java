package io.github.dongyuns.jubjub.payment.repository;

import io.github.dongyuns.jubjub.payment.domain.Payment;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findTopByOrderIdOrderByIdDesc(Long orderId);

    boolean existsByOrderIdAndStatus(Long orderId, io.github.dongyuns.jubjub.payment.domain.PaymentStatus status);

    Optional<Payment> findByMerchantUid(String merchantUid);

    Optional<Payment> findByPortonePaymentId(String portonePaymentId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Payment p where p.id = :id")
    Optional<Payment> findByIdForUpdate(@Param("id") Long id);
}
