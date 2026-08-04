package io.github.dongyuns.jubjub.domain.core.cart.repository;

import io.github.dongyuns.jubjub.domain.core.cart.entity.CartOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CartOptionRepository extends JpaRepository<CartOption, Long> {
}