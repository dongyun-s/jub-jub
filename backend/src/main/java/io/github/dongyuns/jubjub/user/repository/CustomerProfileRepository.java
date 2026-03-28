package io.github.dongyuns.jubjub.user.repository;

import io.github.dongyuns.jubjub.user.domain.CustomerProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerProfileRepository extends JpaRepository<CustomerProfile, Long> {

    Optional<CustomerProfile> findByAccountId(Long accountId);
}
