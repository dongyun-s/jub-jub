package io.github.dongyuns.jubjub.settlement.repository;

import io.github.dongyuns.jubjub.settlement.domain.SettlementItem;
import io.github.dongyuns.jubjub.settlement.domain.SettlementSourceType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SettlementItemRepository extends JpaRepository<SettlementItem, Long> {

    boolean existsBySourceTypeAndSourceId(SettlementSourceType sourceType, Long sourceId);

    List<SettlementItem> findAllBySettlementId(Long settlementId);
}
