package io.github.dongyuns.jubjub.repository;

import io.github.dongyuns.jubjub.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
}