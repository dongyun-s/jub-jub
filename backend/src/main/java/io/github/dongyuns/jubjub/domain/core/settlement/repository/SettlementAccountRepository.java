package io.github.dongyuns.jubjub.domain.core.settlement.repository;

import io.github.dongyuns.jubjub.domain.core.settlement.entity.SettlementAccount;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SettlementAccountRepository extends JpaRepository<SettlementAccount, Long> {

    Optional<SettlementAccount> findByStoreIdAndActiveTrue(Long storeId);
}
