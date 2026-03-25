package io.github.dongyuns.jubjub.settlement.repository;

import io.github.dongyuns.jubjub.settlement.domain.Settlement;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    Optional<Settlement> findByStoreIdAndPeriodStartAndPeriodEnd(Long storeId, LocalDate periodStart, LocalDate periodEnd);

    List<Settlement> findAllByPeriodStartAndPeriodEnd(LocalDate periodStart, LocalDate periodEnd);
}
