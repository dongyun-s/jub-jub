package io.github.dongyuns.jubjub.settlement.repository;

import io.github.dongyuns.jubjub.settlement.domain.SettlementAccount;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SettlementAccountRepository extends JpaRepository<SettlementAccount, Long> {

    Optional<SettlementAccount> findByStoreIdAndActiveTrue(Long storeId);
}
