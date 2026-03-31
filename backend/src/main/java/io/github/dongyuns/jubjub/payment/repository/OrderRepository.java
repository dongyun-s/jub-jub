package io.github.dongyuns.jubjub.payment.repository;

import io.github.dongyuns.jubjub.payment.domain.Order;
import io.github.dongyuns.jubjub.payment.domain.OrderStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import jakarta.persistence.LockModeType;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findAllByMemberProfile_IdOrderByCreatedAtDesc(Long memberProfileId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Order> findByIdAndStatus(Long id, OrderStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Order> findById(Long id);
}
